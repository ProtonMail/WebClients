import { ReadableStream } from 'web-streams-polyfill';

import { asyncGeneratorToArray } from '../../../utils/test/generator';
import ArchiveGenerator from './archiveGenerator';

type TestLink = {
    isFile: boolean;
    name: string;
    path?: string[];
    fileModifyTime?: number;
    expectedName?: string;
    expectedPath?: string;
    expectedLastModified?: Date;
};

async function* generateLinks(links: TestLink[]) {
    for (let link of links) {
        if (link.isFile) {
            yield {
                isFile: link.isFile,
                name: link.name,
                parentPath: link.path || [],
                stream: new ReadableStream<Uint8Array>(),
                fileModifyTime: link.fileModifyTime || 0,
            };
        } else {
            yield {
                isFile: link.isFile,
                name: link.name,
                parentPath: link.path || [],
                fileModifyTime: link.fileModifyTime || 0,
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
                const lastModified = link.expectedLastModified || new Date('1970-01-01 00:00:00+00:00');
                return link.isFile
                    ? {
                          name,
                          input: expect.anything(),
                          lastModified: lastModified,
                      }
                    : {
                          name,
                          lastModified: lastModified,
                      };
            })
        );
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

    it('generates modify date from link timestamp', async () => {
        await checkWritingLinks([
            {
                isFile: true,
                name: 'driveEpoch.txt',
                fileModifyTime: 1571314130,
                expectedLastModified: new Date('2019-10-17 15:08:50+0300'),
            },
            {
                isFile: false,
                name: 'negative',
                fileModifyTime: -10,
                expectedLastModified: new Date('1969-12-31 23:59:50+00:00'),
            },
        ]);
    });
});
