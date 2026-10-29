import { type ReactNode, useEffect, useState } from 'react';

import { clsx } from 'clsx';

import { type IconName, LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { SKILL_MARKDOWN_PATH } from '../types';
import type { WorkspaceFile } from './skillWorkspace';

import './SkillFileTree.scss';

interface SkillFileTreeProps {
    files: WorkspaceFile[];
    activePath: string;
    onSelect: (path: string) => void;
    /** Paths with unsaved changes get a dot, as in the editor design. */
    modifiedPaths?: Set<string>;
    footer?: ReactNode;
    children?: ReactNode;
}

type FolderRow = { kind: 'folder'; key: string; name: string; depth: number; parents: string[] };
type FileRow = { kind: 'file'; key: string; name: string; depth: number; parents: string[]; path: string };

/** Flattens paths into folder and file rows, folders listed once before their contents. */
const toRows = (files: WorkspaceFile[]): (FolderRow | FileRow)[] => {
    const rows: (FolderRow | FileRow)[] = [];
    const seenFolders = new Set<string>();
    for (const { path } of files) {
        const segments = path.split('/');
        const folders = segments.slice(0, -1).map((_, depth) => segments.slice(0, depth + 1).join('/'));
        folders.forEach((key, depth) => {
            if (!seenFolders.has(key)) {
                seenFolders.add(key);
                rows.push({ kind: 'folder', key, name: segments[depth], depth, parents: folders.slice(0, depth) });
            }
        });
        rows.push({
            kind: 'file',
            key: path,
            name: segments[segments.length - 1],
            depth: segments.length - 1,
            parents: folders,
            path,
        });
    }
    return rows;
};

const getFileIcon = (name: string): IconName => {
    if (name === SKILL_MARKDOWN_PATH) return 'ScrollText';
    if (/\.(md|markdown|txt)$/i.test(name)) return 'FileText';
    if (/\.(json|ya?ml|toml)$/i.test(name)) return 'Braces';
    if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) return 'Image';
    if (/\.(js|ts|py|sh|rb|go)$/i.test(name)) return 'FileCode';
    return 'File';
};

const isAncestor = (folder: string, path: string) => path.startsWith(`${folder}/`);

export const SkillFileTree = ({ files, activePath, onSelect, modifiedPaths, footer, children }: SkillFileTreeProps) => {
    // Folders the user opened or closed; others are open at the top level and along the active path.
    const [overrides, setOverrides] = useState<Map<string, boolean>>(() => new Map());

    useEffect(() => {
        setOverrides((prev) => {
            const closedAncestors = Array.from(prev).filter(([key, open]) => !open && isAncestor(key, activePath));
            if (!closedAncestors.length) return prev;
            const next = new Map(prev);
            closedAncestors.forEach(([key]) => next.delete(key));
            return next;
        });
    }, [activePath]);

    const rows = toRows(files);
    const isOpen = (row: FolderRow) => overrides.get(row.key) ?? (row.depth === 0 || isAncestor(row.key, activePath));
    const openFolders = new Set(rows.flatMap((row) => (row.kind === 'folder' && isOpen(row) ? [row.key] : [])));
    const visibleRows = rows.filter((row) => row.parents.every((parent) => openFolders.has(parent)));

    const toggleFolder = (row: FolderRow) =>
        setOverrides((prev) => new Map(prev).set(row.key, !openFolders.has(row.key)));

    return (
        <div className="skill-file-tree flex flex-column flex-nowrap">
            <ul className="skill-file-tree__list flex-1 overflow-auto m-0 list-none" role="tree">
                {visibleRows.map((row) => (
                    <li
                        key={row.kind === 'folder' ? `${row.key}/` : row.key}
                        role="treeitem"
                        aria-expanded={row.kind === 'folder' ? openFolders.has(row.key) : undefined}
                        aria-selected={row.kind === 'file' ? row.path === activePath : undefined}
                        style={{ '--skill-file-depth': row.depth }}
                    >
                        {row.kind === 'folder' ? (
                            <button
                                type="button"
                                className="skill-file-tree__row skill-file-tree__folder flex flex-nowrap items-center gap-1.5 w-full text-left"
                                onClick={() => toggleFolder(row)}
                            >
                                <LumoIcon
                                    aria-hidden
                                    name="ChevronRight"
                                    size={14}
                                    className={clsx(
                                        'skill-file-tree__chevron shrink-0',
                                        openFolders.has(row.key) && 'is-open'
                                    )}
                                />
                                <span className="text-ellipsis">{row.name}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={clsx(
                                    'skill-file-tree__row skill-file-tree__file flex flex-nowrap items-center gap-1.5 w-full text-left',
                                    row.path === activePath && 'is-active'
                                )}
                                aria-current={row.path === activePath ? 'true' : undefined}
                                onClick={() => onSelect(row.path)}
                            >
                                <LumoIcon
                                    aria-hidden
                                    name={getFileIcon(row.name)}
                                    size={14}
                                    className="skill-file-tree__icon shrink-0"
                                />
                                <span className="flex-1 text-ellipsis">{row.name}</span>
                                {modifiedPaths?.has(row.path) && (
                                    <span aria-hidden className="skill-file-tree__dot shrink-0" />
                                )}
                            </button>
                        )}
                    </li>
                ))}
                {children}
            </ul>
            {footer}
        </div>
    );
};
