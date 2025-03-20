interface FileSystemAPI {
    mkdir(path: string): void;
    writeFile(name: string, data: Uint8Array, opts?: object): void;
    readFile(path: string, opts?: { encoding: string }): Uint8Array;
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

declare global {
    interface Window {
        Module: DCRawModule;
        importScripts(...urls: string[]): void;
    }

    interface WorkerGlobalScope {
        Module: DCRawModule;
        importScripts(...urls: string[]): void;
    }
}

export type ProcessResult = Uint8Array<ArrayBufferLike> | null;

/**
 * Class for processing RAW image files and extracting thumbnails
 */
export class RawProcessor {
    private moduleLoaded: Promise<DCRawModule>;

    constructor() {
        this.moduleLoaded = new Promise((resolve, reject) => {
            const Module: Partial<DCRawModule> = {
                onRuntimeInitialized: () => {
                    resolve(self.Module);
                },
            };

            self.Module = Module as DCRawModule;

            try {
                self.importScripts('./dcraw.js');
            } catch (error) {
                console.error('Failed to import WASM script:', error);
                reject(new Error(`Failed to load WASM module: ${error}`));
            }
        });
    }

    /**
     * Waits for the WASM module to be fully initialized
     * @returns Promise that resolves when the module is ready
     */
    public async waitForModuleLoaded(): Promise<void> {
        try {
            await this.moduleLoaded;
        } catch (error) {
            console.error('Error waiting for module to load:', error);
            throw error;
        }
    }

    /**
     * Process a RAW image file and extract its thumbnail
     * @param rawData Raw image file as Uint8Array
     * @param fileName Optional filename to use (helps with identifying the file format)
     * @returns Promise resolving to the Uint8Array<ArrayBufferLike> thumbnail or null
     */
    public async extractThumbnail(rawData: Uint8Array, fileName: string = 'raw_file'): Promise<ProcessResult> {
        try {
            const module = await this.moduleLoaded;
            // Create a unique workspace name
            const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_');
            const workspacePath = `/workspace_${safeFileName}_${Date.now()}`;
            const rawFilename = 'raw_file';
            const thumbFilename = `${rawFilename}.thumb.jpg`;
            // Create workspace
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
