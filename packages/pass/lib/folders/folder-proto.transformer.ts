import { Folder } from '../../types/protobuf/folder-v1';

export const encodeFolder = (folder: Folder): Uint8Array<ArrayBuffer> => {
    const creation = Folder.create(folder);
    return Folder.toBinary(creation) as Uint8Array<ArrayBuffer>;
};

export const decodeFolder = (content: Uint8Array<ArrayBuffer>): Folder => {
    const folder = Folder.fromBinary(content);
    return folder;
};
