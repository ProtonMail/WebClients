export interface AttachmentMime {
    checksum?: string;
    content: Uint8Array;
    contentDisposition?: string;
    contentId?: string;
    contentType?: string;
    fileName?: string;
    generatedFileName?: string;
    length?: number;
    transferEncoding?: string;
}
