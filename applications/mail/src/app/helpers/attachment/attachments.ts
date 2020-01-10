import { Attachment } from '../../models/attachment';

export const isEmbeddedLocal = ({
    Headers: { 'content-disposition': disposition, embedded } = {}
}: Attachment = {}) => {
    return disposition === 'inline' || Number(embedded) === 1;
};
