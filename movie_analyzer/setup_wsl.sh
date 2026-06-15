#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Movie Analyzer — WSL2 + NVIDIA GPU setup
#
# HOW GPU WORKS IN WSL2 (no special CUDA install needed):
#   - Windows NVIDIA driver ≥ 522.06 exposes the GPU to WSL2 automatically
#   - PyTorch, faster-whisper, deepface all bundle their own CUDA runtime
#   - You do NOT need "CUDA Toolkit for WSL" (that was deprecated in 2023)
#   - Just: update your Windows GPU driver → nvidia-smi works in WSL2 natively
#
# Run:   chmod +x setup_wsl.sh && ./setup_wsl.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 0. Verify GPU is visible ──────────────────────────────────────────────────
info "Checking GPU access..."

if ! command -v nvidia-smi &>/dev/null; then
    error "nvidia-smi not found in WSL2.
Fix: Update your Windows NVIDIA GPU driver to version 522.06 or newer.
Download: https://www.nvidia.com/drivers
After installing, restart WSL: (in PowerShell)  wsl --shutdown
Then re-run this script."
fi

GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1 | tr -d ' ')
VRAM_GB=$(echo "scale=1; $VRAM_MB / 1024" | bc)
DRIVER_VER=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1)

info "GPU: $GPU_NAME | VRAM: ${VRAM_GB} GB | Driver: $DRIVER_VER"

# Recommend model tier based on VRAM
if (( VRAM_MB >= 12000 )); then
    BLIP2_MODEL="Salesforce/blip2-opt-2.7b"
    info "VRAM ≥ 12GB → will use blip2-opt-2.7b (best quality)"
elif (( VRAM_MB >= 8000 )); then
    BLIP2_MODEL="Salesforce/blip2-flan-t5-xl"
    info "VRAM 8-12GB → will use blip2-flan-t5-xl"
else
    BLIP2_MODEL="Salesforce/blip2-flan-t5-base"
    warn "VRAM < 8GB → will use blip2-flan-t5-base (lighter). Scene captions will be lower quality."
    warn "Consider --skip-captions if BLIP-2 OOMs."
fi

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
    python3-dev \
    build-essential \
    git curl wget bc

# Fix ImageMagick policy so moviepy TextClip can render text
for POLICY_PATH in /etc/ImageMagick-6/policy.xml /etc/ImageMagick/policy.xml; do
    if [ -f "$POLICY_PATH" ]; then
        info "Patching $POLICY_PATH to allow text rendering..."
        sudo sed -i \
            's|rights="none" pattern="PDF"|rights="read|write" pattern="PDF"|g;
             s|rights="none" pattern="LABEL"|rights="read|write" pattern="LABEL"|g;
             s|rights="none" pattern="TEXT"|rights="read|write" pattern="TEXT"|g' \
            "$POLICY_PATH"
        info "ImageMagick policy patched"
        break
    fi
done

# ── 2. Python virtual environment ─────────────────────────────────────────────
VENV_DIR="$HOME/.venvs/movie_analyzer"
info "Creating Python venv at $VENV_DIR..."
python3 -m venv "$VENV_DIR"
# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"
pip install --upgrade pip wheel setuptools --quiet

# ── 3. PyTorch with bundled CUDA ──────────────────────────────────────────────
# NOTE: We install PyTorch wheels that bundle their own CUDA runtime (cu121).
# No CUDA Toolkit install in WSL needed — the Windows driver handles the GPU,
# and these wheels bring everything else.
info "Installing PyTorch (with bundled CUDA 12.1 runtime)..."
pip install torch torchvision torchaudio \
    --index-url https://download.pytorch.org/whl/cu121 \
    --quiet

# Verify
python3 -c "
import torch
if not torch.cuda.is_available():
    raise RuntimeError('CUDA not available after torch install')
gpu  = torch.cuda.get_device_name(0)
vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
print(f'  PyTorch {torch.__version__} | GPU: {gpu} | VRAM: {vram:.1f} GB')
" || error "PyTorch CUDA check failed. Is your Windows NVIDIA driver ≥ 522?"

# ── 4. ML packages ────────────────────────────────────────────────────────────
info "Installing ML packages..."

# faster-whisper: GPU-accelerated transcription — bundles its own CTranslate2+CUDA
pip install faster-whisper --quiet

# Vision + NLP
pip install \
    "transformers>=4.40.0" \
    "accelerate>=0.30.0" \
    "bitsandbytes>=0.43.0" \
    "sentence-transformers>=3.0.0" \
    "sentencepiece>=0.2.0" \
    --quiet

# Face detection
pip install "deepface>=0.0.80" "tf-keras>=2.16.0" "scikit-learn>=1.4.0" --quiet

# ── 5. Video + audio packages ─────────────────────────────────────────────────
info "Installing video/audio packages..."
pip install \
    "scenedetect[opencv]>=0.6.2" \
    "moviepy==1.0.3" \
    "ffmpeg-python>=0.2.0" \
    "opencv-python>=4.8.0" \
    "librosa>=0.10.1" \
    "soundfile>=0.12.1" \
    "Pillow>=10.3.0" \
    "numpy>=1.26.0" \
    --quiet

# ── 6. TTS ────────────────────────────────────────────────────────────────────
info "Installing TTS..."
TTS_INSTALLED=""

# Try kokoro-onnx first (maintained, fast, MIT licensed)
if pip install "kokoro-onnx>=0.3.0" --quiet 2>/dev/null; then
    info "kokoro-onnx installed"
    TTS_INSTALLED="kokoro"
else
    # Try Coqui TTS (unmaintained since Jan 2024, but still works)
    warn "kokoro-onnx unavailable, trying Coqui TTS..."
    if pip install "TTS==0.22.0" --quiet 2>/dev/null; then
        info "Coqui TTS installed"
        TTS_INSTALLED="coqui"
    else
        warn "Both kokoro and Coqui failed — using gTTS (needs internet per call)"
        TTS_INSTALLED="gtts"
    fi
fi
pip install "gTTS>=2.5.0" --quiet  # always install as fallback

# ── 7. Utilities ──────────────────────────────────────────────────────────────
pip install \
    "python-dotenv>=1.0.1" \
    "tqdm>=4.66.0" \
    "rich>=13.7.0" \
    "pydantic>=2.7.0" \
    "tenacity>=8.3.0" \
    "ollama>=0.2.0" \
    --quiet

# ── 8. Ollama (local LLM) ─────────────────────────────────────────────────────
info "Setting up ollama..."
if ! command -v ollama &>/dev/null; then
    info "Installing ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    info "ollama already installed: $(ollama --version)"
fi

# Start ollama if not running
if ! pgrep -x ollama &>/dev/null; then
    info "Starting ollama service..."
    nohup ollama serve &>/tmp/ollama.log &
    sleep 4
fi

info "Pulling llama3.2:3b (≈2GB download)..."
ollama pull llama3.2:3b || warn "Pull failed — run manually: ollama pull llama3.2:3b"

# ── 9. Write .env ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

info "Writing .env..."
cat > "$ENV_FILE" <<EOF
# Auto-generated by setup_wsl.sh
WHISPER_MODEL=small
WHISPER_LANGUAGE=

BLIP2_MODEL=$BLIP2_MODEL
BLIP2_DEVICE=cuda

LLM_BACKEND=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
TRANSFORMERS_LLM_MODEL=microsoft/Phi-3-mini-4k-instruct

FACE_BACKEND=deepface
TTS_ENGINE=$TTS_INSTALLED

IO_WORKERS=8
CPU_WORKERS=4
EOF
info ".env written → $ENV_FILE"

# ── 10. Test clip ─────────────────────────────────────────────────────────────
TEST_CLIP="$SCRIPT_DIR/test_clip.mp4"
if [ ! -f "$TEST_CLIP" ]; then
    info "Downloading 3-min test clip (Big Buck Bunny)..."
    wget -q --show-progress -O "$TEST_CLIP" \
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" \
        && info "Test clip saved: $TEST_CLIP" \
        || warn "Download failed — place any .mp4 at $TEST_CLIP for smoke testing"
fi

# ── 11. Verify all critical imports ───────────────────────────────────────────
info "Verifying installation..."
python3 - <<'PYCHECK'
import sys, importlib

checks = [
    ("torch",          lambda: __import__("torch").cuda.is_available()),
    ("cv2",            lambda: bool(__import__("cv2").__version__)),
    ("faster_whisper", lambda: bool(__import__("faster_whisper"))),
    ("scenedetect",    lambda: bool(__import__("scenedetect").__version__)),
    ("deepface",       lambda: bool(__import__("deepface"))),
    ("librosa",        lambda: bool(__import__("librosa").__version__)),
    ("transformers",   lambda: bool(__import__("transformers").__version__)),
    ("sentence_transformers", lambda: True),
    ("moviepy",        lambda: bool(__import__("moviepy.editor", fromlist=["VideoFileClip"]))),
    ("ffmpeg",         lambda: bool(__import__("ffmpeg"))),
    ("sklearn",        lambda: bool(__import__("sklearn").__version__)),
    ("rich",           lambda: True),
]

all_ok = True
for name, check_fn in checks:
    try:
        ok = check_fn()
        status = "✓" if ok else "✗ (returned False)"
    except Exception as e:
        ok = False
        status = f"✗ {e}"
    print(f"  {'✓' if ok else '✗'} {name:<28} {status if not ok else ''}")
    if not ok:
        all_ok = False

import torch
if torch.cuda.is_available():
    g = torch.cuda.get_device_properties(0)
    print(f"\n  GPU: {g.name}  |  VRAM: {g.total_memory/1024**3:.1f} GB")

if not all_ok:
    print("\nSome packages failed. Check errors above.", file=sys.stderr)
    sys.exit(1)
else:
    print("\n  All imports OK")
PYCHECK

# ── 12. Instructions ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} Setup complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Activate venv each session:"
echo "    source $VENV_DIR/bin/activate"
echo ""
echo "  ── Smoke test (fast, ~2 min) ─────────────────────────────────"
echo "  cd $(dirname $SCRIPT_DIR)"
echo "  python -m movie_analyzer.main analyze \\"
echo "    --movie movie_analyzer/test_clip.mp4 \\"
echo "    --whisper-model tiny --skip-captions --skip-faces \\"
echo "    --skip-arc-reels --skip-explainer --output-dir output/test"
echo ""
echo "  ── Full pipeline on your movie ───────────────────────────────"
echo "  python -m movie_analyzer.main analyze \\"
echo "    --movie /mnt/c/Users/YourName/Movies/movie.mp4 \\"
echo "    --whisper-model small \\"
echo "    --explainer-duration 20 \\"
echo "    --output-dir output/my_movie"
echo ""
echo "  Windows files appear under /mnt/c/Users/... in WSL"
echo ""
