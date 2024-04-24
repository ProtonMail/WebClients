import { CreateDocumentPayload } from '../../interfaces/drive/documents';

export const queryCreateDocument = (shareId: string, data: CreateDocumentPayload) => ({
    method: 'post',
    url: `drive/shares/${shareId}/documents`,
    data,
});
