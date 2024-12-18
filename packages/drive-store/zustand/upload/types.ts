export interface TokenData {
    token: string;
    timestamp: number;
}

export type AnonymousUploadsToken = Map<string, TokenData>;

export interface AnonymousUploadTokenState {
    _uploadTokens: AnonymousUploadsToken;
    getUploadToken: (linkId: string) => string | undefined;
    hasUploadToken: (linkId: string) => boolean;
    setUploadToken: ({ linkId, authorizationToken }: { linkId: string; authorizationToken: string }) => void;
    removeUploadTokens: (linkId: string | string[]) => void;
}
