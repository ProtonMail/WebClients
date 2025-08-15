interface FileSystemAPI {
    mkdir(path: string): void;
    writeFile(name: string, data: Uint8Array<ArrayBuffer>, opts?: object): void;
    readFile(path: string, opts?: { encoding: string }): Uint8Array<ArrayBuffer>;
    unlink(path: string): void;
    rmdir(path: string): void;
    chdir(path: string): void;
    analyzePath(path: string): { exists: boolean };
}

interface DCRawModule {
    onRuntimeInitialized: () => void;
    callMain(args: string[]): number;
    FS: FileSystemAPI;
}

interface CR3Module {
    onRuntimeInitialized: () => void;
    ccall(name: string, returnType: string, argTypes: string[], args: any[]): any;
    FS: FileSystemAPI;
}

declare global {
    interface Window {
        Module: DCRawModule | CR3Module;
        DCRawModule: DCRawModule;
        CR3Module: CR3Module;
        importScripts(...urls: string[]): void;
    }

    interface WorkerGlobalScope {
        Module: DCRawModule | CR3Module;
        DCRawModule: DCRawModule;
        CR3Module: CR3Module;
        importScripts(...urls: string[]): void;
    }
}

export type ProcessResult = Uint8Array<ArrayBuffer> | null;

/**
 * Class for processing RAW image files and extracting thumbnails
 */
export class RawProcessor {
    private dcrawModuleLoaded: Promise<DCRawModule>;

    constructor() {
        this.dcrawModuleLoaded = new Promise((resolve, reject) => {
            const Module: Partial<DCRawModule> = {
                onRuntimeInitialized: () => {
                    resolve(self.DCRawModule);
                },
            };

            self.DCRawModule = Module as DCRawModule;
            self.Module = Module as DCRawModule;

            try {
                self.importScripts('./dcraw.js');
            } catch (error) {
                console.error('Failed to import dcraw WASM script:', error);
                reject(new Error(`Failed to load dcraw WASM module: ${error}`));
            }
        });
    }

    /**
     * Waits for the dcraw WASM module to be fully initialized
     * @returns Promise that resolves when the module is ready
     */
    public async waitForDCRawModuleLoaded(): Promise<void> {
        try {
            await this.dcrawModuleLoaded;
        } catch (error) {
            console.error('Error waiting for dcraw module to load:', error);
            throw error;
        }
    }

    /**
     * Process a RAW image file and extract its thumbnail
     * @param rawData Raw image file as Uint8Array
     * @param fileName Optional filename to use (helps with identifying the file format)
     * @param extractFullSize Whether to extract the preview image for CR3 files
     * @returns Promise resolving to the Uint8Array thumbnail or CR3Result object or null
     */
    public async extractThumbnail(rawData: Uint8Array<ArrayBuffer>, fileName: string = 'raw_file'): Promise<ProcessResult> {
        return this.extractDCRawThumbnail(rawData, fileName);
    }

    /**
     * Extract thumbnail from non-CR3 RAW files using dcraw
     * @param rawData Raw image file as Uint8Array
     * @param fileName Optional filename to use
     * @returns Promise resolving to the Uint8Array thumbnail or null
     */
    private async extractDCRawThumbnail(rawData: Uint8Array<ArrayBuffer>, fileName: string): Promise<ProcessResult> {
        try {
            const module = await this.dcrawModuleLoaded;

            const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_');
            const workspacePath = `/workspace_${safeFileName}_${Date.now()}`;
            const rawFilename = 'raw_file';
            const thumbFilename = `${rawFilename}.thumb.jpg`;

            module.FS.mkdir(workspacePath);
            module.FS.chdir(workspacePath);

            try {
                // Write RAW file to file system
                module.FS.writeFile(rawFilename, rawData);

                // Extract thumbnail
                module.callMain(['-e', rawFilename]);

                // Check if thumbnail was extracted
                if (!module.FS.analyzePath(thumbFilename).exists) {
                    return null;
                }
                // Read extracted thumbnail
                const extractedThumb = module.FS.readFile(thumbFilename, {
                    encoding: 'binary',
                });

                return extractedThumb;
            } catch (error) {
                console.error(`Error processing RAW file (${fileName}):`, error);
                return null;
            } finally {
                try {
                    if (module.FS.analyzePath(thumbFilename).exists) {
                        module.FS.unlink(thumbFilename);
                    }
                    if (module.FS.analyzePath(rawFilename).exists) {
                        module.FS.unlink(rawFilename);
                    }
                } catch (cleanupError) {
                    console.error('Failed to clean up filesystem:', cleanupError);
                }
            }
        } catch (error) {
            console.error('Module initialization error:', error);
            return null;
        }
    }
}

/**
 * Class for processing RAW image files and extracting thumbnails
 */
export class CR3Processor {
    private cr3ModuleLoaded: Promise<CR3Module> | null = null;

    constructor() {
        this.cr3ModuleLoaded = new Promise((resolve, reject) => {
            const Module: Partial<CR3Module> = {
                onRuntimeInitialized: () => {
                    resolve(self.CR3Module);
                },
            };

            self.CR3Module = Module as CR3Module;
            self.Module = Module as CR3Module;

            try {
                self.importScripts('./cr3.js');
            } catch (error) {
                console.error('Failed to import CR3 WASM script:', error);
                reject(new Error(`Failed to load CR3 WASM module: ${error}`));
            }
        });
    }

    /**
     * Initialize the CR3 module if needed
     * This is separated to avoid loading unnecessary modules
     */
    private initCR3Module(): Promise<CR3Module> {
        if (!this.cr3ModuleLoaded) {
            this.cr3ModuleLoaded = new Promise((resolve, reject) => {
                const Module: Partial<CR3Module> = {
                    onRuntimeInitialized: () => {
                        resolve(self.CR3Module);
                    },
                };

                self.CR3Module = Module as CR3Module;
                self.Module = Module as CR3Module;

                try {
                    self.importScripts('./cr3.js');
                } catch (error) {
                    console.error('Failed to import CR3 WASM script:', error);
                    reject(new Error(`Failed to load CR3 WASM module: ${error}`));
                }
            });
        }
        return this.cr3ModuleLoaded;
    }

    /**
     * Waits for the CR3 WASM module to be fully initialized
     * @returns Promise that resolves when the module is ready
     */
    public async waitForCR3ModuleLoaded(): Promise<void> {
        try {
            await this.initCR3Module();
        } catch (error) {
            console.error('Error waiting for CR3 module to load:', error);
            throw error;
        }
    }

    /**
     * Process a RAW image file and extract its thumbnail
     * @param rawData Raw image file as Uint8Array
     * @param fileName Optional filename to use (helps with identifying the file format)
     * @param extractFullSize Whether to extract the preview image for CR3 files
     * @returns Promise resolving to the Uint8Array thumbnail or CR3Result object or null
     */
    public async extractThumbnail(rawData: Uint8Array<ArrayBuffer>, fileName: string = 'raw_file'): Promise<ProcessResult> {
        return this.extractCR3Images(rawData, fileName);
    }

    /**
     * Extract images from CR3 files using our custom module
     * @param rawData CR3 file as Uint8Array
     * @param fileName Optional filename to use
     * @returns Promise resolving to ProcessResult object or null
     */
    private async extractCR3Images(rawData: Uint8Array<ArrayBuffer>, fileName: string): Promise<ProcessResult | null> {
        try {
            const module = await this.initCR3Module();

            const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_');
            const workspacePath = `/workspace_${safeFileName}_${Date.now()}`;
            const cr3Filename = 'input.CR3';
            const thumbFilename = 'thumbnail.jpg';
            const previewFilename = 'preview.jpg';

            module.FS.mkdir(workspacePath);
            module.FS.chdir(workspacePath);

            try {
                module.FS.writeFile(cr3Filename, rawData);

                const resultJson = module.ccall(
                    'extract_cr3_images',
                    'string',
                    ['string', 'string', 'string'],
                    [cr3Filename, thumbFilename, previewFilename]
                );

                const result = JSON.parse(resultJson);

                if (!result.success) {
                    console.error(`Failed to extract CR3 images: ${result.error}`);
                    return null;
                }

                let cr3Result: ProcessResult = null;

                // CR3 has thumbnail and preview
                // We check on both
                if (result.foundThumbnail) {
                    try {
                        const thumbnailData = module.FS.readFile(thumbFilename);
                        cr3Result = thumbnailData;
                    } catch (e) {
                        console.warn('Failed to read thumbnail file:', e);
                    }
                }

                if (result.foundPreview) {
                    try {
                        const previewData = module.FS.readFile(previewFilename);
                        cr3Result = previewData;
                    } catch (e) {
                        console.warn('Failed to read preview file:', e);
                    }
                }

                return cr3Result;
            } catch (error) {
                console.error(`Error processing CR3 file (${fileName}):`, error);
                return null;
            } finally {
                try {
                    const filesToCleanup = [cr3Filename, thumbFilename, previewFilename];
                    for (const file of filesToCleanup) {
                        if (module.FS.analyzePath(file).exists) {
                            module.FS.unlink(file);
                        }
                    }
                } catch (cleanupError) {
                    console.error('Failed to clean up filesystem:', cleanupError);
                }
            }
        } catch (error) {
            console.error('CR3 module initialization error:', error);
            return null;
        }
    }
}
