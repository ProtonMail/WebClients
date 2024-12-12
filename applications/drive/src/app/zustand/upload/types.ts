import type { AnonymousUploadsToken } from '../../store';

export interface AnonymousUploadTokenState {
    uploadTokens: AnonymousUploadsToken;
    setUploadToken: ({ linkId, authorizationToken }: { linkId: string; authorizationToken: string }) => void;
    removeUploadTokens: (linkId: string | string[]) => void;
}
