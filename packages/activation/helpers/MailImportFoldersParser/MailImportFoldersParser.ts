import { cloneDeep } from 'lodash';

import { ApiMailImporterFolder } from '@proton/activation/api/api.interface';
import { MAX_FOLDERS_DEPTH } from '@proton/activation/constants';
import { MailImportDestinationFolder } from '@proton/activation/interface';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import move from '@proton/utils/move';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

const DESTINATION_FOLDERS = Object.values(MailImportDestinationFolder);

/**
 * MailImportFolder(s) are the result of provider folders parsing
 *
 * created by MailImportFoldersParser class
 */
export interface MailImportFolder {
    /** Api folder source */
    readonly id: ApiMailImporterFolder['Source'];
    readonly category: ApiMailImporterFolder['DestinationCategory'];
    checked: boolean;
    readonly color: string;
    readonly systemFolder: ApiMailImporterFolder['DestinationFolder'];
    readonly isSystemFolderChild: boolean;
    readonly folderChildIDS: ApiMailImporterFolder['Source'][];
    readonly folderParentID: ApiMailImporterFolder['Source'] | undefined;
    /**
     * Path with the proton folders or labels parent/child depth restrictions
     * - if folder id is 'p1/p2/p3/p4/p5' then proton path will be ['p1','p2','p3/p4/p5'].
     * - if label id is 'p1/p2/p3/p4/p5' then proton path will be ['p1-p2-p3-p4-p5']
     * - if folder has a parent destination folder 'Inbox/c/cc' proton path will be ['[Inbox]c', 'cc']
     * - if label has a parent destination folder 'Inbox/c/cc' proton path will be ['[Inbox]c-cc']
     */
    protonPath: string[];
    /**
     * Path without the proton folders or labels parent/child depth restrictions
     *
     * If folder or label id is 'p1/p2/p3/p4' then provider path will be the same
     * as an array. ['p1','p2','p3','p4']
     */
    readonly providerPath: string[];
    readonly separator: ApiMailImporterFolder['Separator'];
    readonly size: ApiMailImporterFolder['Size'];
}

/**
 * Parse folders from provider
 *
 * @returns an array of MailImportFolder
 */
class MailImportFoldersParser {
    private separatorSplitToken: string;

    private providerFolders: ApiMailImporterFolder[];

    private providerFoldersSources: ApiMailImporterFolder['Source'][];

    public folders: MailImportFolder[];

    constructor(apiFolders: ApiMailImporterFolder[], isLabelMapping: boolean) {
        this.separatorSplitToken = `##**${Date.now()}**##`;
        this.providerFoldersSources = apiFolders.map((folder) => folder.Source);
        this.providerFolders = this.sortByDestinationFolder(cloneDeep(apiFolders));
        this.folders = this.createFolders(isLabelMapping);
    }

    /**
     * Sort folders order alphabetically
     *
     * Note about System folders
     * - Parent system folders are not sorted alpha
     * - System folders childs are sorted alpha and moved under their parent system folder
     */
    private sortByDestinationFolder = (apiFolders: ApiMailImporterFolder[]) => {
        const sortedFolders = apiFolders.sort((a, b) => {
            // Parent destination folders
            if (a.DestinationFolder && b.DestinationFolder) {
                return 0;
            }
            if (a.DestinationFolder) {
                return -1;
            }
            if (b.DestinationFolder) {
                return 1;
            }

            // Other folders
            return a.Source.toLowerCase().localeCompare(b.Source.toLowerCase());
        });

        const systemFolderSourcesInList = sortedFolders.reduce<string[]>((acc, folder) => {
            if (folder.DestinationFolder) {
                acc.push(folder.Source);
            }
            return acc;
        }, []);

        let finalSort = sortedFolders;

        systemFolderSourcesInList.forEach((systemFolderSource) => {
            const systemFolderIndex = finalSort.findIndex((f) => f.Source === systemFolderSource);
            const childSources = finalSort.reduce<string[]>((acc, folder) => {
                const path = this.getProviderPath(folder.Source, folder.Separator);

                if (path.length > 1 && path[0] === finalSort[systemFolderIndex].Source) {
                    acc.push(folder.Source);
                }
                return acc;
            }, []);

            childSources.forEach((childSource, index) => {
                const from = finalSort.findIndex((f) => f.Source === childSource);
                const to =
                    (index === 0
                        ? systemFolderIndex
                        : finalSort.findIndex((f) => f.Source === childSources[index - 1])) + 1;

                finalSort = move(finalSort, from, to);
            });
        });

        return finalSort;
    };

    private getProviderPath = (folderSource: ApiMailImporterFolder['Source'] = '', separator = '/') => {
        /**
         * We determine a path based on the provided folder source and separator
         * Example: 'p/c/cc' will become ['p', 'c', 'cc']
         */
        let pathBasedOnSeparator = (() => {
            if (separator !== '/') {
                return folderSource.split(separator);
            }
            return folderSource
                .split('\\/')
                .join(this.separatorSplitToken)
                .split('/')
                .map((s) => s.split(this.separatorSplitToken).join('\\/'));
        })();

        /**
         * We go through each chunk of the path and verify if there's a corresponding source in providerFolders
         *
         * Checks if a source like this 'p/c' has a parent with source 'p'.
         * If yes path will be ['p','c']
         * If not path will be ['p/c']
         */
        const verifiedPath = (() => {
            let isBroken: boolean;
            const result = pathBasedOnSeparator.reduce<string[]>((acc, pathChunk, index) => {
                const isFirstChunk = index === 0;
                if (isFirstChunk) {
                    isBroken = false;
                }

                if (isBroken) {
                    const accWithoutLastChunk = acc.filter((_, accIndex) => acc.length - 1 !== accIndex);
                    const lastChunk = isFirstChunk ? pathChunk : acc[acc.length - 1] + separator + pathChunk;
                    return [...accWithoutLastChunk, lastChunk];
                }

                /**
                 * expectedParentSource value changes through each iterations
                 *
                 * If we discover that parent/child relationship is broken at any chunk
                 * we concatenate for every following chunks
                 *
                 * Example:
                 * - Given the following path ['p', 'c', 'cc', 'ccc'] with '/' separator
                 * - Value at iteration 1 will be 'p'
                 * - Value at iteration 2 will be 'p/c'
                 * - Value at iteration 3 will be 'p/c/cc'
                 * ...
                 */
                const expectedParentSource = isFirstChunk ? pathChunk : acc.join(separator) + separator + pathChunk;

                if (this.providerFoldersSources.includes(expectedParentSource)) {
                    return [...acc, pathChunk];
                } else {
                    isBroken = true;

                    const accWithoutLastChunk = acc.filter((_, accIndex) => acc.length - 1 !== accIndex);
                    const lastChunk = isFirstChunk ? pathChunk : acc[acc.length - 1] + separator + pathChunk;
                    return [...accWithoutLastChunk, lastChunk];
                }
            }, []);

            return result;
        })();

        return verifiedPath;
    };

    private getProtonPath = (
        folderSource: ApiMailImporterFolder['Source'] = '',
        separator = '/',
        isLabelMapping: boolean
    ) => {
        let path = this.getProviderPath(folderSource, separator);
        const parentSystemFolder =
            path.length > 1 &&
            DESTINATION_FOLDERS.find((destFolder) => destFolder.toLocaleLowerCase() === path[0].toLocaleLowerCase());

        if (parentSystemFolder) {
            const [first, second, ...third] = path;
            path = [`[${first}]${second}`, ...third];
        }

        if (isLabelMapping) {
            return [path.join('-')];
        }

        if (path.length <= MAX_FOLDERS_DEPTH) {
            return path;
        }

        const [first, second, ...third] = path;
        return [first, second, third.join(separator)];
    };

    private getFolderChildIds = (index: number, childIds: string[] = [], i = 1): string[] => {
        const folder = this.providerFolders[index];
        const nextFolder = this.providerFolders[index + i];
        if (!nextFolder) {
            return childIds;
        }

        const folderHierachy = this.getProviderPath(folder.Source, folder.Separator);
        const nextFolderHierachy = this.getProviderPath(nextFolder.Source, nextFolder.Separator);

        if (nextFolderHierachy.length > folderHierachy.length) {
            childIds.push(nextFolder.Source);
            return this.getFolderChildIds(index, childIds, i + 1);
        }

        return childIds;
    };

    private getParentFolderId = (index: number, i = 1): string | undefined => {
        const folder = this.providerFolders[index];
        const prevFolder = this.providerFolders[index - i];
        if (!prevFolder) {
            return undefined;
        }

        const folderHierachy = this.getProviderPath(folder.Source, folder.Separator);
        const prevFolderHierachy = this.getProviderPath(prevFolder.Source, prevFolder.Separator);
        if (prevFolderHierachy.length === folderHierachy.length - 1) {
            return prevFolder.Source;
        }

        return this.getParentFolderId(index, i + 1);
    };

    private createFolders(isLabelMapping = false) {
        let memoizedRootFolderColor: MailImportFolder['color'];

        const result = this.providerFolders
            .filter((folder) => !!folder.Source)
            .map((folder, index) => {
                const isRootFolder = this.getProviderPath(folder.Source, folder.Separator).length === 1;

                if (isRootFolder) {
                    // Generate a random color
                    memoizedRootFolderColor = ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)];
                }

                const providerPath = this.getProviderPath(folder.Source, folder.Separator);

                const parsedFolder = {
                    id: folder.Source,
                    providerPath,
                    category: folder.DestinationCategory,
                    checked: true, // By default we assume that every folders should be imported
                    color: memoizedRootFolderColor,
                    systemFolder: folder.DestinationFolder,
                    isSystemFolderChild:
                        providerPath.length > 1 &&
                        this.providerFolders.find((f) => f.DestinationFolder === providerPath[0]) !== undefined,
                    folderChildIDS: this.getFolderChildIds(index),
                    folderParentID: this.getParentFolderId(index),
                    protonPath: this.getProtonPath(folder.Source, folder.Separator, isLabelMapping),
                    separator: folder.Separator,
                    size: folder.Size || 0,
                };

                return parsedFolder;
            });

        return result;
    }
}

export default MailImportFoldersParser;
