#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Movie Analyzer — WSL2 + NVIDIA GPU setup script
# Run this once on your WSL machine:
#   chmod +x setup_wsl.sh && ./setup_wsl.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Verify WSL2 + NVIDIA ───────────────────────────────────────────────────
info "Checking environment..."

if ! grep -qi "microsoft" /proc/version 2>/dev/null; then
    warn "Not running in WSL — continuing anyway (script works on native Linux too)"
fi

if ! command -v nvidia-smi &>/dev/null; then
    error "nvidia-smi not found.\n\
  On WSL2: install the NVIDIA CUDA driver from Windows:\n\
  https://developer.nvidia.com/cuda/wsl\n\
  Then restart WSL: wsl --shutdown && wsl"
fi

info "GPU detected:"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader

CUDA_VERSION=$(nvidia-smi | grep -oP "CUDA Version: \K[\d.]+" || echo "unknown")
info "CUDA version: $CUDA_VERSION"

# ── 1. System packages ────────────────────────────────────────────────────────
info "Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y \
    ffmpeg \
    imagemagick \
    libsndfile1 \
    libsndfile1-dev \
    python3-venv \
    python3-pip \
    git \
    curl \
    wget

# Fix ImageMagick policy to allow text/PDF rendering (required by moviepy TextClip)
POLICY="/etc/ImageMagick-6/policy.xml"
if [ -f "$POLICY" ]; then
    info "Patching ImageMagick policy.xml to allow text rendering..."
    sudo sed -i 's|<policy domain="coder" rights="none" pattern="PDF">|<policy domain="coder" rights="read|write" pattern="PDF">|g' "$POLICY"
    sudo sed -i 's|<policy domain="coder" rights="none" pattern="LABEL">|<policy domain="coder" rights="read|write" pattern="LABEL">|g' "$POLICY"
fi

# ── 2. Python virtual environment ─────────────────────────────────────────────
VENV_DIR="$HOME/.venvs/movie_analyzer"
info "Creating Python venv at $VENV_DIR..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip wheel

# ── 3. PyTorch with CUDA ──────────────────────────────────────────────────────
info "Installing PyTorch with CUDA support..."

# Detect CUDA major version for the right torch wheel
CUDA_MAJOR=$(echo "$CUDA_VERSION" | cut -d. -f1)
CUDA_MINOR=$(echo "$CUDA_VERSION" | cut -d. -f2)

if [ "$CUDA_MAJOR" -ge 12 ]; then
    TORCH_INDEX="https://download.pytorch.org/whl/cu121"
    info "Using CUDA 12.x torch wheels"
elif [ "$CUDA_MAJOR" -eq 11 ] && [ "$CUDA_MINOR" -ge 8 ]; then
    TORCH_INDEX="https://download.pytorch.org/whl/cu118"
    info "Using CUDA 11.8 torch wheels"
else
    warn "CUDA $CUDA_VERSION: using CUDA 11.8 wheels (oldest supported)"
    TORCH_INDEX="https://download.pytorch.org/whl/cu118"
fi

pip install torch torchvision torchaudio --index-url "$TORCH_INDEX"

# Verify CUDA is usable
python3 -c "
import torch
assert torch.cuda.is_available(), 'CUDA not available after install!'
gpu = torch.cuda.get_device_name(0)
mem = torch.cuda.get_device_properties(0).total_memory / 1024**3
print(f'  GPU: {gpu}')
print(f'  VRAM: {mem:.1f} GB')
" || error "CUDA torch verification failed. Check your NVIDIA driver."

# ── 4. Core ML packages ───────────────────────────────────────────────────────
info "Installing core ML packages..."

# faster-whisper: GPU-accelerated transcription (4x faster than openai-whisper)
pip install faster-whisper

# BLIP-2 and transformers stack
pip install \
    transformers>=4.40.0 \
    accelerate>=0.30.0 \
    bitsandbytes>=0.43.0 \
    sentence-transformers>=3.0.0 \
    sentencepiece>=0.2.0

# Face detection
pip install deepface>=0.0.80 tf-keras>=2.16.0 scikit-learn>=1.4.0

# ── 5. Video / audio packages ─────────────────────────────────────────────────
info "Installing video/audio packages..."
pip install \
    "scenedetect[opencv]>=0.6.2" \
    moviepy==1.0.3 \
    ffmpeg-python>=0.2.0 \
    "opencv-python>=4.8.0" \
    librosa>=0.10.1 \
    soundfile>=0.12.1 \
    Pillow>=10.3.0 \
    numpy>=1.26.0

# ── 6. TTS ────────────────────────────────────────────────────────────────────
info "Installing TTS (trying kokoro-onnx first, Coqui as fallback)..."
if pip install kokoro-onnx>=0.3.0 2>/dev/null; then
    info "kokoro-onnx installed (recommended)"
    echo "TTS_ENGINE=kokoro" >> .env 2>/dev/null || true
else
    warn "kokoro-onnx failed, trying Coqui TTS..."
    pip install TTS==0.22.0 || warn "Coqui TTS also failed — will use gTTS (needs internet)"
fi
pip install gTTS>=2.5.0  # always install fallback

# ── 7. Utilities ──────────────────────────────────────────────────────────────
pip install \
    python-dotenv>=1.0.1 \
    tqdm>=4.66.0 \
    rich>=13.7.0 \
    pydantic>=2.7.0 \
    tenacity>=8.3.0 \
    ollama>=0.2.0

# ── 8. Ollama (local LLM) ─────────────────────────────────────────────────────
info "Installing ollama..."
if ! command -v ollama &>/dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh
fi

info "Starting ollama service..."
ollama serve &>/dev/null &
sleep 3

info "Pulling llama3.2:3b model (this may take a few minutes)..."
ollama pull llama3.2:3b || warn "llama3.2 pull failed — run manually: ollama pull llama3.2:3b"

# ── 9. Create .env ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    info "Creating .env from .env.example..."
    cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
fi

# Auto-set GPU device
sed -i 's/BLIP2_DEVICE=auto/BLIP2_DEVICE=cuda/' "$ENV_FILE"
sed -i 's/LLM_BACKEND=auto/LLM_BACKEND=ollama/' "$ENV_FILE"
sed -i 's/WHISPER_MODEL=base/WHISPER_MODEL=small/' "$ENV_FILE"

# ── 10. Download test video ───────────────────────────────────────────────────
TEST_CLIP="$SCRIPT_DIR/test_clip.mp4"
if [ ! -f "$TEST_CLIP" ]; then
    info "Downloading a 3-minute test clip (Big Buck Bunny excerpt)..."
    wget -q -O "$TEST_CLIP" \
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" \
        || warn "Could not download test clip. Place any .mp4 at $TEST_CLIP to test."
fi

# ── 11. Verify install ────────────────────────────────────────────────────────
info "Verifying installation..."
python3 -c "
import torch, cv2, numpy, faster_whisper, scenedetect, librosa, ffmpeg
print('  torch:', torch.__version__, '| CUDA:', torch.cuda.is_available())
print('  cv2:', cv2.__version__)
print('  faster_whisper: ok')
print('  scenedetect:', scenedetect.__version__)
print('  librosa:', librosa.__version__)
print('  All core imports OK')
"

# ── 12. Print run instructions ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} Setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Activate venv:     source $VENV_DIR/bin/activate"
echo "  Project dir:       $SCRIPT_DIR/.."
echo ""
echo "  Quick test (fast, skips BLIP-2 and face detection):"
echo "    python -m movie_analyzer.main analyze \\"
echo "      --movie movie_analyzer/test_clip.mp4 \\"
echo "      --whisper-model tiny \\"
echo "      --skip-captions \\"
echo "      --skip-faces \\"
echo "      --skip-arc-reels \\"
echo "      --skip-explainer \\"
echo "      --output-dir output/test"
echo ""
echo "  Full pipeline on your movie (GPU recommended):"
echo "    python -m movie_analyzer.main analyze \\"
echo "      --movie /path/to/your/movie.mp4 \\"
echo "      --whisper-model small \\"
echo "      --llm-backend ollama \\"
echo "      --ollama-model llama3.2:3b \\"
echo "      --explainer-duration 20 \\"
echo "      --output-dir output/movie_name"
echo ""
echo "  VRAM guide:"
echo "    4GB  → --skip-captions (no BLIP-2) + whisper small"
echo "    8GB  → full pipeline with blip2-flan-t5-xl"
echo "    12GB → full pipeline with blip2-opt-2.7b (default, best quality)"
echo ""
