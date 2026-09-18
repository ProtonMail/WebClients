import getRandomString from '@proton/utils/getRandomString';

import type { Folder } from '../../types/protobuf/folder-v1';
import { decodeFolder, encodeFolder } from './folder-proto.transformer';

describe('FolderTransformer', () => {
    it('should encode and decode a folder correctly', () => {
        const source: Folder = {
            name: getRandomString(10),
        };

        const encoded = encodeFolder(source);
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeFolder(encoded);
        expect(decoded.name).toStrictEqual(source.name);
    });
});
