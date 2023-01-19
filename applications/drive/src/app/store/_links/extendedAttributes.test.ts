import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { mockGlobalFile, testFile } from '../../utils/test/file';
import {
    createFileExtendedAttributes,
    createFolderExtendedAttributes,
    parseExtendedAttributes,
} from './extendedAttributes';

const emptyExtendedAttributes = {
    Common: {
        ModificationTime: undefined,
        Size: undefined,
        BlockSizes: undefined,
    },
};

describe('extended attrbiutes', () => {
    beforeAll(() => {
        jest.spyOn(global.console, 'warn').mockReturnValue();
    });

    beforeEach(() => {
        mockGlobalFile();
    });

    it('creates the struct from the folder', () => {
        const testCases: [Date, object][] = [
            [
                new Date(1234567890000),
                {
                    Common: {
                        ModificationTime: '2009-02-13T23:31:30.000Z',
                    },
                },
            ],
            [new Date('2022-22-22'), {}],
        ];
        testCases.forEach(([input, expectedAttributes]) => {
            const xattrs = createFolderExtendedAttributes(input);
            expect(xattrs).toMatchObject(expectedAttributes);
        });
    });

    it('creates the struct from the file', () => {
        const testCases: [File, { width: number; height: number } | undefined, object][] = [
            [
                testFile('testfile.txt', 123),
                undefined,
                {
                    Common: {
                        ModificationTime: '2009-02-13T23:31:30.000Z',
                        Size: 123,
                        BlockSizes: [123],
                    },
                },
            ],
            [
                testFile('testfile.txt', FILE_CHUNK_SIZE * 2 + 123),
                { width: 100, height: 200 },
                {
                    Common: {
                        ModificationTime: '2009-02-13T23:31:30.000Z',
                        Size: FILE_CHUNK_SIZE * 2 + 123,
                        BlockSizes: [FILE_CHUNK_SIZE, FILE_CHUNK_SIZE, 123],
                    },
                    Media: {
                        Width: 100,
                        Height: 200,
                    },
                },
            ],
        ];
        testCases.forEach(([input, media, expectedAttributes]) => {
            const xattrs = createFileExtendedAttributes(input, media);
            expect(xattrs).toMatchObject(expectedAttributes);
        });
    });

    it('parses the struct', () => {
        const testCases: [string, object][] = [
            ['', emptyExtendedAttributes],
            ['{}', emptyExtendedAttributes],
            ['a', emptyExtendedAttributes],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000"}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {"Size": 123}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: 123,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000", "Size": 123, "BlockSizes": [1, 2, 3]}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: 123,
                        BlockSizes: [1, 2, 3],
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "aa", "Size": 123}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: 123,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000", "Size": "aaa"}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000", "BlockSizes": "aaa"}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {}, "Media": {}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {}, "Media": {"Width": "aa", "Height": "aa"}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {}, "Media": {"Width": 100, "Height": "aa"}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                },
            ],
            [
                '{"Common": {}, "Media": {"Width": 100, "Height": 200}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: undefined,
                        BlockSizes: undefined,
                    },
                    Media: {
                        Width: 100,
                        Height: 200,
                    },
                },
            ],
        ];
        testCases.forEach(([input, expectedAttributes]) => {
            const xattrs = parseExtendedAttributes(input);
            expect(xattrs).toMatchObject(expectedAttributes);
        });
    });
});
