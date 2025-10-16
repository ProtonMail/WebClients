import { asyncGeneratorToArray } from '../../utils/test/generator';
import ArchiveGenerator from './ArchiveGenerator';

type TestLink = {
    isFile: boolean;
    name: string;
    fileModifyTime?: number;
    path?: string[];
    expectedName?: string;
    expectedPath?: string;
    expectedLastModified?: Date;
};

async function* generateLinks(links: TestLink[]) {
    for (const link of links) {
        if (link.isFile) {
            yield {
                isFile: link.isFile,
                name: link.name,
                parentPath: link.path || [],
                fileModifyTime: link.fileModifyTime,
                stream: new ReadableStream<Uint8Array<ArrayBuffer>>(),
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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const checkWritingLinks = async (links: TestLink[]) => {
        const archiver = new ArchiveGenerator();
        const transformedLinks = await asyncGeneratorToArray(archiver.transformLinksToZipItems(generateLinks(links)));
        expect(transformedLinks).toMatchObject(
            links.map((link) => {
                const path = link.expectedPath || (link.path || []).join('/');
                const fileName = link.expectedName || link.name;
                const name = path ? `${path}/${fileName}` : fileName;
                const lastModified =
                    link.expectedLastModified ||
                    (typeof link.fileModifyTime === 'number' ? new Date(link.fileModifyTime * 1000) : undefined);
                return link.isFile
                    ? {
                          name,
                          input: expect.anything(),
                          lastModified,
                      }
                    : {
                          name,
                      };
            })
        );
    };

    it('should generate two files and one folder in the root', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'Hello.txt', fileModifyTime: 1692780131 },
            {
                isFile: true,
                name: 'World.txt',
                fileModifyTime: 1692780009,
                expectedLastModified: new Date('2023-08-23T08:40:09.000Z'),
            },
            { isFile: false, name: 'dir' },
        ]);
    });

    it('should generate two files in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: true, name: 'Hello.txt', path: ['dir'] },
            { isFile: true, name: 'World.txt', path: ['dir'] },
        ]);
    });

    it('should generate two files with the same name', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'file.txt' },
            { isFile: true, name: 'file.txt', expectedName: 'file (1).txt' },
        ]);
    });

    it('should generate two folders with the same name', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: false, name: 'dir', expectedName: 'dir (1)' },
        ]);
    });

    it('should generate a file and folder with the same name', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'name' },
            { isFile: false, name: 'name', expectedName: 'name (1)' },
        ]);
    });

    // If file is written first, then folder is renamed.
    it('should generate a file and folder with the same name in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: true, name: 'name', path: ['dir'] },
            { isFile: false, name: 'name', path: ['dir'], expectedName: 'name (1)' },
            { isFile: false, name: 'subfolder', path: ['dir', 'name'], expectedPath: 'dir/name (1)' },
        ]);
    });

    // If folder is written first, then file is renamed.
    it('should generate a folder and file with the same name in the folder', async () => {
        await checkWritingLinks([
            { isFile: false, name: 'dir' },
            { isFile: false, name: 'name', path: ['dir'] },
            { isFile: true, name: 'name', path: ['dir'], expectedName: 'name (1)' },
            { isFile: false, name: 'subfolder', path: ['dir', 'name'] },
        ]);
    });

    it('should generate many files with the same name but different case', async () => {
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
