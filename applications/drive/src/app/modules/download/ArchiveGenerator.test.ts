import { asyncGeneratorToArray } from '../../utils/tests/generator';
import ArchiveGenerator from './ArchiveGenerator';
import type { ArchiveItem } from './downloadTypes';

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
    for (const [index, link] of links.entries()) {
        if (link.isFile) {
            yield {
                isFile: link.isFile,
                uid: `uid-${index}`,
                name: link.name,
                parentPath: link.path || [],
                fileModifyTime: link.fileModifyTime,
                stream: new ReadableStream<Uint8Array<ArrayBuffer>>(),
            };
        } else {
            yield {
                isFile: link.isFile,
                uid: `uid-${index}`,
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

    it('should sanitize path-traversal sequences in file and folder names', async () => {
        await checkWritingLinks([
            { isFile: false, name: '../..', expectedName: '.._..', expectedPath: '' },
            {
                isFile: true,
                name: '../../evil.exe',
                path: ['../..'],
                expectedName: '.._.._evil.exe',
                expectedPath: '.._..',
            },
        ]);
    });

    // A folder awaiting a signature-issue decision can be overtaken by its own children,
    // which have no such wait and finish first (see DownloadScheduler concurrency).
    it('should nest children arriving before their parent folder', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'Child.txt', path: ['Folder'] },
            { isFile: true, name: 'Child2.txt', path: ['Folder'] },
            { isFile: false, name: 'Folder' },
        ]);
    });

    it('should nest children arriving before their whole parent chain', async () => {
        await checkWritingLinks([
            { isFile: true, name: 'Child.txt', path: ['dir', 'subdir'] },
            { isFile: false, name: 'subdir', path: ['dir'] },
            { isFile: false, name: 'dir' },
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

    describe('planEntries', () => {
        const streamOf = (size: number) =>
            new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                    controller.enqueue(new Uint8Array(size));
                    controller.close();
                },
            });

        const countBytes = async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
            let total = 0;
            const reader = stream.getReader();
            for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
                total += chunk.value.byteLength;
            }
            return total;
        };

        it('should predict the exact length of the written archive', async () => {
            const archiver = new ArchiveGenerator();
            const length = archiver.planEntries([
                { uid: 'dir', isFile: false, name: 'dir', parentPath: [] },
                { uid: 'file', isFile: true, name: 'élan 🎉.bin', parentPath: ['dir'], size: 2048 },
                { uid: 'empty', isFile: true, name: 'empty.txt', parentPath: [], size: 0 },
            ]);

            async function* links(): AsyncGenerator<ArchiveItem> {
                yield { isFile: true, uid: 'empty', name: 'empty.txt', parentPath: [], stream: streamOf(0) };
                yield {
                    isFile: true,
                    uid: 'file',
                    name: 'élan 🎉.bin',
                    parentPath: ['dir'],
                    stream: streamOf(2048),
                    fileModifyTime: 1692780131,
                };
                yield { isFile: false, uid: 'dir', name: 'dir', parentPath: [] };
            }
            const [writtenBytes] = await Promise.all([countBytes(archiver.stream), archiver.writeLinks(links())]);

            expect(length).toBe(writtenBytes);
        });

        it('should write the planned names in the planned order whatever order the links arrive in', async () => {
            const archiver = new ArchiveGenerator();
            archiver.planEntries([
                { uid: 'real', isFile: true, name: 'a (1).txt', parentPath: [], size: 1 },
                { uid: 'first', isFile: true, name: 'a.txt', parentPath: [], size: 1 },
                { uid: 'second', isFile: true, name: 'a.txt', parentPath: [], size: 1 },
            ]);

            async function* links(): AsyncGenerator<ArchiveItem> {
                for (const uid of ['second', 'first', 'real']) {
                    yield {
                        isFile: true,
                        uid,
                        name: uid === 'real' ? 'a (1).txt' : 'a.txt',
                        parentPath: [],
                        stream: streamOf(1),
                    };
                }
            }
            const items = await asyncGeneratorToArray(archiver.transformLinksToZipItems(links()));

            expect(items.map((item) => item.name)).toEqual(['a (1).txt', 'a.txt', 'a (2).txt']);
        });

        describe('when the same node is listed twice', () => {
            const repeatedEntry = { uid: 'file', isFile: true, name: 'a.txt', parentPath: [], size: 3 };

            async function* repeatedLinks(): AsyncGenerator<ArchiveItem> {
                for (let i = 0; i < 2; i++) {
                    yield { isFile: true, uid: 'file', name: 'a.txt', parentPath: [], stream: streamOf(3) };
                }
            }

            it('should write a distinct name for each occurrence', async () => {
                const archiver = new ArchiveGenerator();
                archiver.planEntries([repeatedEntry, repeatedEntry]);

                const items = await asyncGeneratorToArray(archiver.transformLinksToZipItems(repeatedLinks()));

                expect(items.map((item) => item.name)).toEqual(['a.txt', 'a (1).txt']);
            });

            it('should predict the exact length of the written archive', async () => {
                const archiver = new ArchiveGenerator();
                const length = archiver.planEntries([repeatedEntry, repeatedEntry]);

                const [writtenBytes] = await Promise.all([
                    countBytes(archiver.stream),
                    archiver.writeLinks(repeatedLinks()),
                ]);

                expect(length).toBe(writtenBytes);
            });
        });

        it('should not predict a length when a file size is unknown', () => {
            const archiver = new ArchiveGenerator();

            expect(
                archiver.planEntries([
                    { uid: 'known', isFile: true, name: 'known.txt', parentPath: [], size: 10 },
                    { uid: 'unknown', isFile: true, name: 'unknown.txt', parentPath: [] },
                ])
            ).toBeUndefined();
        });

        it('should predict a length when the archive needs Zip64', () => {
            const archiver = new ArchiveGenerator();

            expect(
                archiver.planEntries([{ uid: 'big', isFile: true, name: 'big.bin', parentPath: [], size: 0xffffffff }])
            ).toBeGreaterThan(0xffffffff);
        });
    });
});
