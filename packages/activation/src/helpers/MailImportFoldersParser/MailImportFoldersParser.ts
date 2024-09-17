import cloneDeep from 'lodash/cloneDeep';

import type { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import { MAX_FOLDERS_DEPTH } from '@proton/activation/src/constants';
import { MailImportDestinationFolder } from '@proton/activation/src/interface';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import isTruthy from '@proton/utils/isTruthy';
import move from '@proton/utils/move';

const DESTINATION_FOLDERS = Object.values(MailImportDestinationFolder);
export const PROTON_DEFAULT_SEPARATOR = '/';

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
 * @example
 * ```
 * const parser = new MailImportFoldersParser(apiFolders, isLabelMapping);
 * const parsedFolders = parser.folders;
 * ```
 * @returns MailImportFoldersParser.folders - The parsed folders - MailImportFolder[]
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
     * - System folders children are sorted alpha and moved under their parent system folder
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
                const path = this.getProviderPath(folder, folder.Separator);

                if (
                    path.length > 1 &&
                    path[0].toLocaleLowerCase() === finalSort[systemFolderIndex].Source.toLocaleLowerCase()
                ) {
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

    private getProviderPath = (folder: ApiMailImporterFolder, separator = PROTON_DEFAULT_SEPARATOR) => {
        // Outlook imports contains the hierarchy in the folder object to determine the path
        // If the hierarchy is present, we use it instead of creating the path from the source
        if (folder.Hierarchy) {
            return folder.Hierarchy;
        }
        /**
         * We determine a path based on the provided folder source and separator
         * Example: 'p/c/cc' will become ['p', 'c', 'cc']
         */
        const folderSource = folder.Source || '';
        let pathBasedOnSeparator = (() => {
            if (separator !== PROTON_DEFAULT_SEPARATOR) {
                return folderSource.split(separator);
            }
            return folderSource
                .split('\\/')
                .join(this.separatorSplitToken)
                .split(PROTON_DEFAULT_SEPARATOR)
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
                 * we concatenate for every following chunks, starting on last chunk
                 * except for the case where the last chunk is a system folder
                 *
                 * Example:
                 * - Given the following path ['p', 'c', 'cc', 'ccc'] with '/' separator
                 * - Value at iteration 1 will be 'p'
                 * - Value at iteration 2 will be 'p/c'
                 * - Value at iteration 3 will be 'p/c/cc'
                 * ...
                 */
                const expectedParentSource = isFirstChunk ? pathChunk : acc.join(separator) + separator + pathChunk;
                if (
                    this.providerFoldersSources.some(
                        (item) => item.toLocaleLowerCase() === expectedParentSource.toLocaleLowerCase()
                    )
                ) {
                    return [...acc, pathChunk];
                } else {
                    isBroken = true;

                    // Checking whether we should start a new chunk or concatenate current chunk with last chunk
                    const shouldStartNewChunk =
                        isFirstChunk ||
                        (this.providerFoldersSources.includes(acc[acc.length - 1]) &&
                            DESTINATION_FOLDERS.find(
                                (destFolder) =>
                                    destFolder.toLocaleLowerCase() === acc[acc.length - 1].toLocaleLowerCase()
                            ));

                    const lastChunk = shouldStartNewChunk ? pathChunk : acc[acc.length - 1] + separator + pathChunk;

                    const accWithoutLastChunk = acc.filter((_, accIndex) => acc.length - 1 !== accIndex);
                    return shouldStartNewChunk ? [...acc, lastChunk] : [...accWithoutLastChunk, lastChunk];
                }
            }, []);

            return result;
        })();

        return verifiedPath;
    };

    private getProtonPath = (folder: ApiMailImporterFolder, isLabelMapping: boolean) => {
        let path = this.getProviderPath(folder, folder.Separator);
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
        return [first, second, third.join(folder.Separator)];
    };

    private getFolderChildIds = (index: number, providerPath: string[]): string[] => {
        const folder = this.providerFolders[index];

        /**
         * Children are folder that starts with the same source and have a separator right at the end of the current folder
         *
         * For example the following folder:
         * 'folder' is the parent of 'folder/sub folder' since 'folder/sub folder' starts with 'folder' and has '/' right after
         */
        return this.providerFolders
            .map((item) => {
                const isItemProbableChild =
                    item.Source.startsWith(folder.Source) &&
                    item.Source.charAt(folder.Source.length) === folder.Separator;

                if (!isItemProbableChild) {
                    return false;
                }

                // There are cases where another folder could contain the same source name
                if (item.Hierarchy) {
                    // We test if the last item of the current folder provider path is contained in the tested item hierarchy
                    const latestItem = providerPath[providerPath.length - 1];
                    if (!item.Hierarchy.includes(latestItem)) {
                        return false;
                    }
                }

                return item;
            })
            .filter(isTruthy)
            .map((item) => item.Source);
    };

    private getParentFolderId = (index: number): string | undefined => {
        const folder = this.providerFolders[index];

        /**
         * Parents folders are folders that are one level above in the providerPath
         * We must return the whole parent path and not just the parent id, this is why we do the slice
         * It can either be undefined or a string
         */
        const folderProviderPath = this.getProviderPath(folder, folder.Separator);
        return folderProviderPath.slice(0, folderProviderPath.length - 1).join(folder.Separator) || undefined;
    };

    private createFolders(isLabelMapping = false) {
        let memoizedRootFolderColor: MailImportFolder['color'];

        const result = this.providerFolders
            .filter((folder) => !!folder.Source)
            .map((folder, index) => {
                const providerPath = this.getProviderPath(folder, folder.Separator);
                const isRootFolder = providerPath.length === 1;

                if (isRootFolder) {
                    // Generate a random color
                    memoizedRootFolderColor = getRandomAccentColor();
                }

                // System subfolders need to have root parent with a destination.
                const isSystemFolderChild = this.providerFolders.some((item) => {
                    return item.Source === providerPath[0] && providerPath.length > 1 && item.DestinationFolder;
                });

                const parsedFolder = {
                    id: folder.Source,
                    providerPath,
                    category: folder.DestinationCategory,
                    checked: true, // By default we assume that every folders should be imported
                    color: memoizedRootFolderColor,
                    systemFolder: folder.DestinationFolder,
                    isSystemFolderChild: isSystemFolderChild,
                    folderChildIDS: this.getFolderChildIds(index, providerPath),
                    folderParentID: this.getParentFolderId(index),
                    protonPath: this.getProtonPath(folder, isLabelMapping),
                    separator: folder.Separator,
                    size: folder.Size || 0,
                };

                return parsedFolder;
            });

        const sortedResults = new Set<MailImportFolder>();
        result.forEach((item) => {
            if (item.folderChildIDS.length > 0) {
                sortedResults.add(item);
                item.folderChildIDS.forEach((childId) => {
                    const child = result.find((item) => item.id.endsWith(childId));
                    if (child) {
                        sortedResults.add(child);
                    }
                });
            }
            sortedResults.add(item);
        });

        return Array.from(sortedResults);
    }
}

export default MailImportFoldersParser;
