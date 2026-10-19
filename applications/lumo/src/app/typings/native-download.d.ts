/** Native WebView bridges for saving blobs; see `remote/lumoImageDownload.ts`. */
declare global {
    interface Window {
        Android?: {
            saveBase64Image?: (base64: string, mimeType: string, name: string) => void;
            saveBase64File?: (base64: string, mimeType: string, name: string) => void;
        };
        webkit?: {
            messageHandlers?: {
                saveImage?: {
                    postMessage: (message: { base64: string; mimeType: string; name: string }) => void;
                };
            };
        };
    }
}

export {};
