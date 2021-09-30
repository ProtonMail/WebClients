import { mockGlobalFile, testFile } from '../../helpers/test/file';
import { createExtendedAttributes, parseExtendedAttributes } from './extendedAttributes';

const emptyExtendedAttributes = {
    Common: {
        ModificationTime: undefined,
        Size: undefined,
    },
};

describe('extended attrbiutes', () => {
    beforeEach(() => {
        mockGlobalFile();
    });

    it('creates the struct from the file', () => {
        const file = testFile('testfile.txt', 123);
        const xattrs = createExtendedAttributes(file);
        expect(xattrs).toMatchObject({
            Common: {
                ModificationTime: '2009-02-13T23:31:30.000Z',
                Size: 123,
            },
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
                    },
                },
            ],
            [
                '{"Common": {"Size": 123}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: 123,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000", "Size": 123}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: 123,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "aa", "Size": 123}}',
                {
                    Common: {
                        ModificationTime: undefined,
                        Size: 123,
                    },
                },
            ],
            [
                '{"Common": {"ModificationTime": "2009-02-13T23:31:30+0000", "Size": "aaa"}}',
                {
                    Common: {
                        ModificationTime: 1234567890,
                        Size: undefined,
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
