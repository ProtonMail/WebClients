import type { CreateDocumentPayload } from '../../interfaces/drive/documents';

export const queryCreateDocument = (shareId: string, data: CreateDocumentPayload) => ({
    method: 'post',
    url: `drive/shares/${shareId}/documents`,
    data,
});

/** Public **/
export const queryPublicCreateDocument = (
    token: string,
    data: Omit<CreateDocumentPayload, 'SignatureAddress' | 'ContentKeyPacketSignature' | 'XAttr'> & {
        SignatureEmail?: string;
        ContentKeyPacketSignature?: string;
    }
) => ({
    method: 'post',
    url: `drive/urls/${token}/documents`,
    data,
});
