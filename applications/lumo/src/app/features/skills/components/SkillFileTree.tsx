import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { SKILL_MARKDOWN_PATH } from '../types';
import type { WorkspaceEntryKind, WorkspaceFile } from './skillWorkspace';

import './SkillFileTree.scss';

/** A name being typed in the tree: a new file or folder in `parent`, or a new name for `path`. */
export type SkillFileTreeEdit =
    | { kind: 'create'; parent: string; entry: WorkspaceEntryKind }
    | { kind: 'rename'; path: string; entry: WorkspaceEntryKind };

interface SkillFileTreeProps {
    files: WorkspaceFile[];
    /** Empty folders, shown until a file goes in them. */
    folders?: string[];
    activePath: string;
    /** The highlighted folder, where new files and folders go; `''` is the top level. */
    selectedFolder?: string;
    onSelectFile: (path: string) => void;
    onSelectFolder?: (folder: string) => void;
    /** Paths with unsaved changes get a dot, as in the editor design. */
    modifiedPaths?: Set<string>;
    footer?: ReactNode;
    edit?: SkillFileTreeEdit;
    onStartRename?: (path: string, entry: WorkspaceEntryKind) => void;
    onRemove?: (path: string, entry: WorkspaceEntryKind) => void;
    /** Returns an error to show, or nothing once the name is applied. */
    onCommitEdit?: (name: string) => string | undefined;
    onCancelEdit?: () => void;
    canRename?: (path: string, entry: WorkspaceEntryKind) => boolean;
    canRemove?: (path: string, entry: WorkspaceEntryKind) => boolean;
}

type Row = { kind: WorkspaceEntryKind; path: string; name: string; depth: number; parents: string[] };

type FolderNode = { folders: Map<string, FolderNode>; files: string[] };

const newNode = (): FolderNode => ({ folders: new Map(), files: [] });

/** Builds the rows of the tree: folders first, then files, each sorted by name; the root SKILL.md comes first. */
const toRows = (filePaths: string[], folderPaths: string[]): Row[] => {
    const root = newNode();
    const getFolder = (segments: string[]) =>
        segments.reduce((node, segment) => {
            if (!node.folders.has(segment)) node.folders.set(segment, newNode());
            return node.folders.get(segment) as FolderNode;
        }, root);
    filePaths.forEach((path) => {
        const segments = path.split('/');
        getFolder(segments.slice(0, -1)).files.push(segments[segments.length - 1]);
    });
    folderPaths.forEach((path) => getFolder(path.split('/')));

    const rows: Row[] = [];
    const byName = (a: string, b: string) => a.localeCompare(b);
    const walk = (node: FolderNode, parents: string[]) => {
        const prefix = parents.length ? `${parents[parents.length - 1]}/` : '';
        const depth = parents.length;
        [...node.folders.keys()].sort(byName).forEach((name) => {
            const path = `${prefix}${name}`;
            rows.push({ kind: 'folder', path, name, depth, parents });
            walk(node.folders.get(name) as FolderNode, [...parents, path]);
        });
        const files = [...node.files].sort((a, b) =>
            depth === 0 && a === SKILL_MARKDOWN_PATH ? -1 : depth === 0 && b === SKILL_MARKDOWN_PATH ? 1 : byName(a, b)
        );
        files.forEach((name) => rows.push({ kind: 'file', path: `${prefix}${name}`, name, depth, parents }));
    };
    walk(root, []);
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

/** The folders a path is in, outermost first: `a/b/c.md` is in `a` and `a/b`. */
const getAncestors = (path: string) =>
    path
        .split('/')
        .slice(0, -1)
        .map((_, index, segments) => segments.slice(0, index + 1).join('/'));

interface NameInputProps {
    initialName: string;
    entry: WorkspaceEntryKind;
    depth: number;
    onCommit: (name: string) => string | undefined;
    onCancel: () => void;
}

/** The inline name field for a new or renamed entry. Enter applies, Escape cancels, leaving applies. */
const NameInput = ({ initialName, entry, depth, onCommit, onCancel }: NameInputProps) => {
    const [value, setValue] = useState(initialName);
    const [error, setError] = useState<string>();
    const descriptionId = useId();
    // Set once the edit is applied or cancelled, so the blur that follows doesn't apply it again.
    const doneRef = useRef(false);

    const cancel = () => {
        doneRef.current = true;
        onCancel();
    };

    // translator: Accessible name of the field for typing the name of a new or renamed folder in a skill.
    const folderLabel = c('collider_2025:Label').t`Folder name`;
    // translator: Accessible name of the field for typing the name of a new or renamed file in a skill.
    const fileLabel = c('collider_2025:Label').t`File name`;
    // translator: Hint under the name field of a new file: typing "/" in the name puts the file in a folder.
    const folderHint = c('collider_2025:Info').t`Use / to put it in a folder.`;

    const description = error ?? (entry === 'file' && !initialName ? folderHint : undefined);

    const commit = () => {
        if (!value.trim()) {
            cancel();
            return;
        }
        const nextError = onCommit(value);
        doneRef.current = !nextError;
        setError(nextError);
    };

    return (
        <div className="skill-file-tree__name-input" style={{ '--skill-file-depth': depth }}>
            <div className="flex flex-nowrap items-center gap-1.5">
                <LumoIcon
                    aria-hidden
                    name={entry === 'folder' ? 'Folder' : getFileIcon(value)}
                    size={14}
                    className="skill-file-tree__icon shrink-0"
                />
                <Input
                    autoFocus
                    value={value}
                    onValue={(next) => {
                        setValue(next);
                        setError(undefined);
                    }}
                    // Like a file explorer, select the name without its extension.
                    onFocus={(event) => {
                        const dot = entry === 'file' ? value.lastIndexOf('.') : -1;
                        event.currentTarget.setSelectionRange(0, dot > 0 ? dot : value.length);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            commit();
                        }
                    }}
                    // The editor modal closes on Escape from a listener on its own element, which runs before
                    // React's bubbling handlers. Catching Escape while capturing stops it reaching the modal.
                    onKeyDownCapture={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            cancel();
                        }
                    }}
                    onBlur={() => {
                        if (doneRef.current) return;
                        if (!value.trim() || onCommit(value)) cancel();
                    }}
                    placeholder={entry === 'folder' ? 'folder' : 'file.md'}
                    aria-label={entry === 'folder' ? folderLabel : fileLabel}
                    aria-describedby={description ? descriptionId : undefined}
                    aria-invalid={!!error}
                    error={!!error}
                />
            </div>
            {description && (
                <p id={descriptionId} className={clsx('m-0 mt-1 text-xs', error ? 'color-danger' : 'color-hint')}>
                    {description}
                </p>
            )}
        </div>
    );
};

export const SkillFileTree = ({
    files,
    folders = [],
    activePath,
    selectedFolder,
    onSelectFile,
    onSelectFolder,
    modifiedPaths,
    footer,
    edit,
    onStartRename,
    onRemove,
    onCommitEdit,
    onCancelEdit,
    canRename = () => true,
    canRemove = () => true,
}: SkillFileTreeProps) => {
    // Folders opened or closed, by the user or because a file in them was opened. They stay that way until
    // toggled, so opening another file or adding a skill doesn't collapse the folders already open.
    const [overrides, setOverrides] = useState<Map<string, boolean>>(() => new Map());
    const focusPath = edit?.kind === 'create' ? `${edit.parent}/` : (edit?.path ?? activePath);

    useEffect(() => {
        setOverrides((prev) => {
            const ancestors = [...getAncestors(activePath), ...getAncestors(focusPath)];
            const toOpen = ancestors.filter((folder) => prev.get(folder) !== true);
            if (!toOpen.length) return prev;
            const next = new Map(prev);
            toOpen.forEach((folder) => next.set(folder, true));
            return next;
        });
    }, [activePath, focusPath]);

    const rows = toRows(
        files.map((file) => file.path),
        folders
    );
    const isOpen = (row: Row) =>
        overrides.get(row.path) ??
        (row.depth === 0 || isAncestor(row.path, activePath) || isAncestor(row.path, focusPath));
    const openFolders = new Set(rows.flatMap((row) => (row.kind === 'folder' && isOpen(row) ? [row.path] : [])));
    const visibleRows = rows.filter((row) => row.parents.every((parent) => openFolders.has(parent)));

    const toggleFolder = (row: Row) => setOverrides((prev) => new Map(prev).set(row.path, !openFolders.has(row.path)));

    // translator: Tooltip of the button that renames a file or folder in a skill (imperative).
    const renameTitle = c('collider_2025:Action').t`Rename`;
    // translator: Tooltip of the button that deletes a file or folder from a skill (imperative).
    const deleteTitle = c('collider_2025:Action').t`Delete`;

    const getRowActions = (row: Row) => ({
        rename: onStartRename && canRename(row.path, row.kind) ? () => onStartRename(row.path, row.kind) : undefined,
        remove: onRemove && canRemove(row.path, row.kind) ? () => onRemove(row.path, row.kind) : undefined,
    });

    const editHandlers = {
        onCommit: (name: string) => onCommitEdit?.(name),
        onCancel: () => onCancelEdit?.(),
    };

    const createInput = (parent: string, depth: number) =>
        edit?.kind === 'create' && edit.parent === parent ? (
            <li key={`create:${parent}`} role="treeitem" aria-selected>
                <NameInput initialName="" entry={edit.entry} depth={depth} {...editHandlers} />
            </li>
        ) : null;

    const renderRow = (row: Row) => {
        const isFolder = row.kind === 'folder';
        const isActive = !isFolder && row.path === activePath;
        const isSelected = isFolder && row.path === selectedFolder;

        if (edit?.kind === 'rename' && edit.path === row.path) {
            return (
                <li key={`rename:${row.path}`} role="treeitem" aria-selected>
                    <NameInput initialName={row.name} entry={row.kind} depth={row.depth} {...editHandlers} />
                </li>
            );
        }

        const { name } = row;
        // translator: Accessible name of the button that renames a file or folder. ${name} is the file or folder name.
        const renameLabel = c('collider_2025:Action').t`Rename ${name}`;
        // translator: Accessible name of the button that deletes a file or folder. ${name} is the file or folder name.
        const deleteLabel = c('collider_2025:Action').t`Delete ${name}`;
        const { rename, remove } = getRowActions(row);

        return (
            <li
                key={isFolder ? `${row.path}/` : row.path}
                role="treeitem"
                aria-expanded={isFolder ? openFolders.has(row.path) : undefined}
                aria-selected={isActive || isSelected}
            >
                <div
                    className={clsx(
                        'skill-file-tree__row flex flex-nowrap items-center',
                        isActive && 'is-active',
                        isSelected && 'is-selected'
                    )}
                    style={{ '--skill-file-depth': row.depth }}
                >
                    <button
                        type="button"
                        className={clsx(
                            'skill-file-tree__label flex flex-nowrap flex-1 items-center gap-1.5 min-w-0 text-left',
                            isFolder ? 'skill-file-tree__folder' : 'skill-file-tree__file'
                        )}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => {
                            if (isFolder) {
                                toggleFolder(row);
                                onSelectFolder?.(row.path);
                            } else {
                                onSelectFile(row.path);
                            }
                        }}
                        onDoubleClick={rename}
                        onKeyDown={(event) => {
                            if (event.key === 'F2' && rename) {
                                event.preventDefault();
                                rename();
                            }
                        }}
                    >
                        {isFolder ? (
                            <LumoIcon
                                aria-hidden
                                name="ChevronRight"
                                size={14}
                                className={clsx(
                                    'skill-file-tree__chevron shrink-0',
                                    openFolders.has(row.path) && 'is-open'
                                )}
                            />
                        ) : (
                            <LumoIcon
                                aria-hidden
                                name={getFileIcon(row.name)}
                                size={14}
                                className="skill-file-tree__icon shrink-0"
                            />
                        )}
                        <span className="flex-1 text-ellipsis">{row.name}</span>
                        {modifiedPaths?.has(row.path) && <span aria-hidden className="skill-file-tree__dot shrink-0" />}
                    </button>
                    {(rename || remove) && (
                        <span className="skill-file-tree__actions flex-nowrap shrink-0">
                            {rename && (
                                <Button
                                    icon
                                    size="small"
                                    shape="ghost"
                                    title={renameTitle}
                                    aria-label={renameLabel}
                                    onClick={rename}
                                >
                                    <LumoIcon aria-hidden name="Pencil" size={13} className="color-hint" />
                                </Button>
                            )}
                            {remove && (
                                <Button
                                    icon
                                    size="small"
                                    shape="ghost"
                                    title={deleteTitle}
                                    aria-label={deleteLabel}
                                    onClick={remove}
                                >
                                    <LumoIcon aria-hidden name="Trash" size={13} className="color-hint" />
                                </Button>
                            )}
                        </span>
                    )}
                </div>
            </li>
        );
    };

    return (
        <div className="skill-file-tree flex flex-column flex-nowrap">
            {/* Clicking the empty space below the rows selects the top level, as in a file explorer. */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
            <ul
                className="skill-file-tree__list flex-1 overflow-auto m-0 list-none"
                role="tree"
                onClick={(event) => {
                    if (event.target === event.currentTarget) onSelectFolder?.('');
                }}
            >
                {createInput('', 0)}
                {visibleRows.map((row) => [
                    renderRow(row),
                    row.kind === 'folder' && openFolders.has(row.path) ? createInput(row.path, row.depth + 1) : null,
                ])}
            </ul>
            {footer}
        </div>
    );
};
