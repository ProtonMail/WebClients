import { NodeType } from '@proton/drive';

import type { DriveNode } from '../hooks/useDriveSDK';

export interface DriveFileWithPath extends DriveNode {
    relativePath: string;
}

export interface CollectDriveFolderFilesResult {
    files: DriveFileWithPath[];
    treeEventScopeId?: string;
}

export type BrowseFolderChildren = (folderUid?: string, forceRefresh?: boolean) => Promise<DriveNode[]>;

/** Recursively collect all files from a folder and its subfolders in one walk. */
export async function collectDriveFolderFiles(
    folderUid: string,
    browseFolderChildren: BrowseFolderChildren,
    basePath: string = '',
    treeEventScopeId?: string
): Promise<CollectDriveFolderFilesResult> {
    const allFiles: DriveFileWithPath[] = [];
    let scopeId = treeEventScopeId;

    try {
        const children = await browseFolderChildren(folderUid);

        for (const child of children) {
            if (!scopeId && child.treeEventScopeId) {
                scopeId = child.treeEventScopeId;
            }

            if (child.type === NodeType.File) {
                allFiles.push({
                    ...child,
                    relativePath: basePath ? `${basePath}/${child.name}` : child.name,
                });
            } else if (child.type === NodeType.Folder) {
                const subfolderPath = basePath ? `${basePath}/${child.name}` : child.name;
                const subfolderResult = await collectDriveFolderFiles(
                    child.nodeUid,
                    browseFolderChildren,
                    subfolderPath,
                    scopeId
                );
                allFiles.push(...subfolderResult.files);
                if (!scopeId && subfolderResult.treeEventScopeId) {
                    scopeId = subfolderResult.treeEventScopeId;
                }
            }
        }
    } catch (error) {
        console.error(`[DriveIndexing] Failed to collect files from folder ${folderUid}:`, error);
    }

    return { files: allFiles, treeEventScopeId: scopeId };
}
