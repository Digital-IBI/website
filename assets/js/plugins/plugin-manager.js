/**
 * Plugin Manager
 * Manages different service adapters and plugins
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.adapters = new Map();
        this.init();
    }

    init() {
        this.registerAdapters();
        this.loadPlugins();
    }

    // Register service adapters
    registerAdapters() {
        // Upload adapters
        this.adapters.set('upload.local', LocalUploadAdapter);
        this.adapters.set('upload.netlify', NetlifyUploadAdapter);
        this.adapters.set('upload.firebase', FirebaseUploadAdapter);

        // Storage adapters
        this.adapters.set('storage.local', LocalStorageAdapter);
        this.adapters.set('storage.database', DatabaseStorageAdapter);
        this.adapters.set('storage.api', ApiStorageAdapter);

        // Processing adapters
        this.adapters.set('processing.local', LocalProcessingAdapter);
        this.adapters.set('processing.cloud', CloudProcessingAdapter);
    }

    // Load plugins based on config
    loadPlugins() {
        const config = window.CONFIG;
        
        // Load upload plugin
        const uploadService = config.services.upload;
        const UploadAdapter = this.adapters.get(`upload.${uploadService}`);
        if (UploadAdapter) {
            this.plugins.set('upload', new UploadAdapter());
        }

        // Load storage plugin
        const storageService = config.services.storage;
        const StorageAdapter = this.adapters.get(`storage.${storageService}`);
        if (StorageAdapter) {
            this.plugins.set('storage', new StorageAdapter());
        }

        // Load processing plugin
        const processingService = config.services.processing;
        const ProcessingAdapter = this.adapters.get(`processing.${processingService}`);
        if (ProcessingAdapter) {
            this.plugins.set('processing', new ProcessingAdapter());
        }
    }

    // Get plugin by name
    getPlugin(name) {
        return this.plugins.get(name);
    }

    // Execute plugin method
    async execute(pluginName, method, ...args) {
        const plugin = this.getPlugin(pluginName);
        if (!plugin) {
            throw new Error(`Plugin ${pluginName} not found`);
        }

        if (typeof plugin[method] !== 'function') {
            throw new Error(`Method ${method} not found in plugin ${pluginName}`);
        }

        try {
            return await plugin[method](...args);
        } catch (error) {
            console.error(`Error executing ${pluginName}.${method}:`, error);
            
            // Fallback to local if available
            if (CONFIG.getSettings().fallback && pluginName !== 'upload') {
                const localPlugin = this.plugins.get('upload');
                if (localPlugin && localPlugin[method]) {
                    console.log(`Falling back to local ${pluginName}`);
                    return await localPlugin[method](...args);
                }
            }
            
            throw error;
        }
    }

    // Check if plugin is available
    hasPlugin(name) {
        return this.plugins.has(name);
    }

    // Get all available plugins
    getAvailablePlugins() {
        return Array.from(this.plugins.keys());
    }
}

// Make plugin manager globally available
window.PluginManager = PluginManager; 