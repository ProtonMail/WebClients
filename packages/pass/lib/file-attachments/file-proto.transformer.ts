import type { FileMetadata, MaybeNull } from '@proton/pass/types';
import { File } from '@proton/pass/types/protobuf/file-v1';

export const encodeFileContent = (metadata: FileMetadata): Uint8Array => {
    const creation = File.create({ metadata });
    return File.toBinary(creation);
};

export const decodeFileContent = (content: Uint8Array): MaybeNull<FileMetadata> => {
    const { metadata } = File.fromBinary(content);
    return metadata ? { ...metadata } : null;
};
