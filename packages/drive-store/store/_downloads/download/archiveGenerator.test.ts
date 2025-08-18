import { fromUnixTime } from 'date-fns';

import { asyncGeneratorToArray } from '../../../utils/test/generator';
import ArchiveGenerator from './archiveGenerator';

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
                    link.expectedLastModified || (link.fileModifyTime && fromUnixTime(link.fileModifyTime));
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

    it('generates two files and one folder in the root', async () => {
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
