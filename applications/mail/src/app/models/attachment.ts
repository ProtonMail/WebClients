export interface Attachment {
    ID?: string;
    Name?: string;
    Size?: number;
    Preview?: any;
    KeyPackets?: any;
    MIMEType?: string;
    data?: any;
    Headers?: { [key: string]: string };
    Encrypted?: number;
    Signature?: any;
}

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
