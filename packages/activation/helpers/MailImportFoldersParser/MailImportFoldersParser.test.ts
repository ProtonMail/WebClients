import { ApiMailImporterFolder } from '@proton/activation/api/api.interface';
import { MailImportDestinationFolder } from '@proton/activation/interface';

import MailImportFoldersParser, { MailImportFolder } from './MailImportFoldersParser';

/**
 * List of provider folders paths
 *
 * It should respect the parent/child order. No childs can be before their parent
 *
 * Naming:
 * - p => parent
 * - c => child
 * - cc => subchild
 * - ...
 */
const paths = [
    'Inbox',
    'p',
    'p/c',
    'p/c2',
    'p/c2/cc',
    'p/c3',
    'p2',
    'p2/c',
    'p2/c/cc',
    'p2/c/cc/ccc',
    'p2/c/cc/ccc/cccc',
    'p2/c/cc/ccc/cccc',
];

/** Basic ApiMailImporterFolders: Source is the minimal required fields */
const getApiFolders = (paths: string[]) =>
    paths.map(
        (path) =>
            ({
                Source: path,
                Separator: '/',
                ...(Object.values(MailImportDestinationFolder).some((dest) => dest.toLowerCase() === path.toLowerCase())
                    ? { DestinationFolder: path }
                    : {}),
            } as ApiMailImporterFolder)
    );

/** Used for testing purpose: Allows to navigate quickier through results */
const getMapping = (folders: MailImportFolder[]) =>
    folders.reduce<Record<string, MailImportFolder>>((acc, folder) => {
        acc[folder.id] = folder;
        return acc;
    }, {});

describe('MailFolderMapping', () => {
    describe('Folders', () => {
        it('Should contain expected ids', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(paths.every((path) => path in foldersMapping)).toBe(true);
        });
        it('Should contain expected path', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping.Inbox.protonPath).toEqual(['Inbox']);
            expect(foldersMapping['p/c2/cc'].protonPath).toEqual(['p', 'c2', 'cc']);
        });
        it('Should have color defined', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping.Inbox.color).toBeDefined();
            expect(foldersMapping['p/c2/cc'].color).toBeDefined();
        });
        it('Should contain expected folderParentIDs', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping.Inbox.folderParentID).toBeUndefined();
            expect(foldersMapping['p/c2'].folderParentID).toBe('p');
            expect(foldersMapping['p/c3'].folderParentID).toBe('p');
            expect(foldersMapping['p/c2/cc'].folderParentID).toBe('p/c2');
        });

        it('Should contain expected childIDS', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping.Inbox.folderChildIDS).toEqual([]);
            expect(foldersMapping.p.folderChildIDS).toEqual(['p/c', 'p/c2', 'p/c2/cc', 'p/c3']);
            expect(foldersMapping['p/c2'].folderChildIDS).toEqual(['p/c2/cc']);
            expect(foldersMapping['p/c2'].folderChildIDS).toEqual(['p/c2/cc']);
        });

        it('Should contain a valid protonPath for folders', () => {
            const isLabelMapping = false;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping['p2/c/cc/ccc/cccc'].protonPath).toEqual(['p2', 'c', 'cc/ccc/cccc']);
        });

        it('Should contain a valid protonPath for labels', () => {
            const isLabelMapping = true;
            const foldersMapping = getMapping(
                new MailImportFoldersParser(getApiFolders(paths), isLabelMapping).folders
            );

            expect(foldersMapping['p2/c'].protonPath).toEqual(['p2-c']);
            expect(foldersMapping['p2/c/cc/ccc/cccc'].protonPath).toEqual(['p2-c-cc-ccc-cccc']);
        });

        it('Should have a specific syntax when system folders have subfolders', () => {
            const apiFolders = getApiFolders([
                'Inbox',
                'Inbox/c',
                'Inbox/c/cc',
                'Inbox/c/cc/ccc',
                'Inbox/c/cc/ccc/cccc',
            ]);
            const foldersMapping = getMapping(new MailImportFoldersParser(apiFolders, false).folders);
            expect(foldersMapping['Inbox/c'].protonPath).toEqual(['[Inbox]c']);
            expect(foldersMapping['Inbox/c/cc'].protonPath).toEqual(['[Inbox]c', 'cc']);
            expect(foldersMapping['Inbox/c/cc/ccc'].protonPath).toEqual(['[Inbox]c', 'cc', 'ccc']);
            expect(foldersMapping['Inbox/c/cc/ccc/cccc'].protonPath).toEqual(['[Inbox]c', 'cc', 'ccc/cccc']);

            const labelsMapping = getMapping(new MailImportFoldersParser(apiFolders, true).folders);
            expect(labelsMapping['Inbox/c'].protonPath).toEqual(['[Inbox]c']);
            expect(labelsMapping['Inbox/c/cc'].protonPath).toEqual(['[Inbox]c-cc']);
        });

        it('Should tag systemfoldersChilds', () => {
            const apiFolders = getApiFolders(['Inbox', 'Inbox/c', 'Inbox/c/cc', 'Inbox/c/cc/ccc', 'dude', 'dude/c']);
            const foldersMapping = getMapping(new MailImportFoldersParser(apiFolders, false).folders);
            expect(foldersMapping.Inbox.isSystemFolderChild).toBe(false);
            expect(foldersMapping['Inbox/c'].isSystemFolderChild).toBe(true);
            expect(foldersMapping['Inbox/c/cc'].isSystemFolderChild).toBe(true);
            expect(foldersMapping['Inbox/c/cc/ccc'].isSystemFolderChild).toBe(true);
            expect(foldersMapping.dude.isSystemFolderChild).toBe(false);
            expect(foldersMapping['dude/c'].isSystemFolderChild).toBe(false);
        });

        it('Should reorder correctly', () => {
            // Reorder when child before a parent
            let apiFolders = getApiFolders(['p/c', 'p']);
            let foldersMapping = new MailImportFoldersParser(apiFolders, false).folders;
            expect(foldersMapping.map((f) => f.id)).toEqual(['p', 'p/c']);

            // Reorders nothing when everything is correctly ordered
            apiFolders = getApiFolders(paths);
            foldersMapping = new MailImportFoldersParser(apiFolders, false).folders;
            expect(foldersMapping.map((f) => f.id)).toEqual(paths);

            // Reorders when system folders has child in wrong place
            apiFolders = getApiFolders(['inbox', '1234', 'inbox/c']);
            foldersMapping = new MailImportFoldersParser(apiFolders, false).folders;
            expect(foldersMapping.map((f) => f.id)).toEqual(['inbox', 'inbox/c', '1234']);

            // Reorders when system folders has child in wrong place
            // Non system folders moves dowmside when above system folder
            apiFolders = getApiFolders([
                'inbox',
                'drafts/c/cc',
                'dude',
                'drafts/c',
                'drafts',
                'inbox/c',
                'inbox/c/cc',
                'dude/child',
                'adude',
            ]);
            foldersMapping = new MailImportFoldersParser(apiFolders, false).folders;
            expect(foldersMapping.map((f) => f.id)).toEqual([
                'inbox',
                'inbox/c',
                'inbox/c/cc',
                'drafts',
                'drafts/c',
                'drafts/c/cc',
                'adude',
                'dude',
                'dude/child',
            ]);
        });

        it('Should ensure that a folder with no parents containing separator is a valid folder', () => {
            const apiFolders = getApiFolders(['p/c/cc', 'parent', 'parent/child']);
            const foldersMapping = getMapping(new MailImportFoldersParser(apiFolders, false).folders);
            expect(foldersMapping['p/c/cc'].protonPath).toEqual(['p/c/cc']);
            expect(foldersMapping['p/c/cc'].providerPath).toEqual(['p/c/cc']);
            const labelsMapping = getMapping(new MailImportFoldersParser(apiFolders, true).folders);
            expect(labelsMapping['p/c/cc'].protonPath).toEqual(['p/c/cc']);
            expect(labelsMapping['p/c/cc'].providerPath).toEqual(['p/c/cc']);

            const apiFoldersA = getApiFolders(['p/c', 'parent', 'parent/child']);
            const foldersMappingA = getMapping(new MailImportFoldersParser(apiFoldersA, false).folders);
            expect(foldersMappingA['p/c'].protonPath).toEqual(['p/c']);
            expect(foldersMappingA['p/c'].providerPath).toEqual(['p/c']);
            const labelsMappingA = getMapping(new MailImportFoldersParser(apiFoldersA, true).folders);
            expect(labelsMappingA['p/c'].protonPath).toEqual(['p/c']);
            expect(labelsMappingA['p/c'].providerPath).toEqual(['p/c']);

            const apiFoldersB = getApiFolders(['p', 'p/c', 'p/c/cc/ccc']);
            const foldersMappingB = getMapping(new MailImportFoldersParser(apiFoldersB, false).folders);
            expect(foldersMappingB['p/c/cc/ccc'].protonPath).toEqual(['p', 'c/cc/ccc']);
            expect(foldersMappingB['p/c/cc/ccc'].providerPath).toEqual(['p', 'c/cc/ccc']);

            const apiFoldersC = getApiFolders(['p', 'p/c', 'p/c/cc', 'p/c/cc/ccc', 'p/c/cc/ccc/cccc/ccccc']);
            const foldersMappingC = getMapping(new MailImportFoldersParser(apiFoldersC, false).folders);
            expect(foldersMappingC['p/c/cc/ccc/cccc/ccccc'].protonPath).toEqual(['p', 'c', 'cc/ccc/cccc/ccccc']);
            expect(foldersMappingC['p/c/cc/ccc/cccc/ccccc'].providerPath).toEqual(['p', 'c', 'cc', 'ccc/cccc/ccccc']);
            const labelsMappingC = getMapping(new MailImportFoldersParser(apiFoldersC, true).folders);
            expect(labelsMappingC['p/c/cc/ccc/cccc/ccccc'].providerPath).toEqual(['p', 'c', 'cc', 'ccc/cccc/ccccc']);
            expect(labelsMappingC['p/c/cc/ccc/cccc/ccccc'].protonPath).toEqual(['p-c-cc-ccc/cccc/ccccc']);
        });
    });
});
