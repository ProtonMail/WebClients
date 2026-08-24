import type { FileMetadata as Metadata } from '../../types';
import { FileMetadata } from '../../types/protobuf/file-v1';

export const encodeFileMetadata = (metadata: Metadata): Uint8Array<ArrayBuffer> => {
    const creation = FileMetadata.create(metadata);
    return FileMetadata.toBinary(creation) as Uint8Array<ArrayBuffer>;
};

export const decodeFileMetadata = (content: Uint8Array<ArrayBuffer>): FileMetadata => {
    const metadata = FileMetadata.fromBinary(content);
    return metadata;
};
