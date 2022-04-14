import { ReadableStream } from 'web-streams-polyfill';

import ArchiveGenerator from './archiveGenerator';

type TestLink = {
    isFile: boolean;
    name: string;
    path?: string[];
    expectedName?: string;
    expectedPath?: string;
};

async function* generateLinks(links: TestLink[]) {
    for (let link of links) {
        if (link.isFile) {
            yield {
                isFile: link.isFile,
                name: link.name,
                parentPath: link.path || [],
                stream: new ReadableStream<Uint8Array>(),
            };
        } else {
            yield {
                isFile: link.isFile,
                name: link.name,
                parentPath: link.path || [],
            };
        }
    }
}

describe('ArchiveGenerator', () => {
    const mockWrite = jest.fn();
    const mockInitZipWriter = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockInitZipWriter.mockReturnValue({
            writable: {
                getWriter: jest.fn().mockReturnValue({
                    write: mockWrite,
                    close: jest.fn(),
                    abort: jest.fn(),
                }),
            },
        });
    });

    const checkWritingLinks = async (links: TestLink[]) => {
        const archiver = new ArchiveGenerator(mockInitZipWriter);
        await archiver.writeLinks(generateLinks(links));
        links.forEach((link) => {
            const path = link.expectedPath || (link.path || []).join('/');
            const fileName = link.expectedName || link.name;
            const name = path ? `${path}/${fileName}` : fileName;
            expect(mockWrite).toBeCalledWith(
                link.isFile
                    ? {
                          name,
                          stream: expect.anything(),
                      }
                    : {
                          name,
                          directory: true,
                      }
            );
        });
    };

    it('generates two files and one folder in the root', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'Hello.txt' },
            { isFile: true, name: 'World.txt' },
            { isFile: false, name: 'dir' },
        ]);
    });

    it('generates two files in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: true, name: 'Hello.txt', path: ['dir'] },
            { isFile: true, name: 'World.txt', path: ['dir'] },
        ]);
    });

    it('generates two files with the same name', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'file.txt' },
            { isFile: true, name: 'file.txt', expectedName: 'file (1).txt' },
        ]);
    });

    it('generates two folder with the same name', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: false, name: 'dir', expectedName: 'dir (1)' },
        ]);
    });

    it('generates file and folder with the same name', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'name' },
            { isFile: false, name: 'name', expectedName: 'name (1)' },
        ]);
    });

    // If file is written first, then folder is renamed.
    it('generates file and folder with the same name in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: true, name: 'name', path: ['dir'] },
            { isFile: false, name: 'name', path: ['dir'], expectedName: 'name (1)' },
            { isFile: false, name: 'subfolder', path: ['dir', 'name'], expectedPath: 'dir/name (1)' },
        ]);
    });

    // If folder is written first, then file is renamed.
    it('generates folder and file with the same name in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: false, name: 'name', path: ['dir'] },
            { isFile: true, name: 'name', path: ['dir'], expectedName: 'name (1)' },
            { isFile: false, name: 'subfolder', path: ['dir', 'name'] },
        ]);
    });

    it('generates many files with with the same name but different case', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'file.txt' },
            { isFile: true, name: 'File.txt', expectedName: 'File (1).txt' },
            { isFile: true, name: 'FILE.txt', expectedName: 'FILE (2).txt' },
            { isFile: true, name: 'file.TXT', expectedName: 'file (3).TXT' },
            { isFile: true, name: 'FILE.TXT', expectedName: 'FILE (4).TXT' },
            { isFile: true, name: 'File.Txt', expectedName: 'File (5).Txt' },
            { isFile: true, name: 'FilE.TxT', expectedName: 'FilE (6).TxT' },
        ]);
    });
});
