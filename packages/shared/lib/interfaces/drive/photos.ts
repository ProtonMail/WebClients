export interface Photo {
    LinkID: string;
    CaptureTime: number;
    MainPhotoLinkID: string | null;
    Exif: string | null;
    Hash: string | null;
    ContentHash: string | null;
}
