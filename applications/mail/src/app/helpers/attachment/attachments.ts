import { Attachment } from '../../models/attachment';

export const embeddableTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

export const isEmbeddedLocal = ({
    Headers: { 'content-disposition': disposition, embedded } = {}
}: Attachment = {}) => {
    return disposition === 'inline' || Number(embedded) === 1;
};

export const isEmbeddable = (fileType: string) => embeddableTypes.includes(fileType);
