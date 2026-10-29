import { useEffect, useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { README_PATH, hasRootSkillMarkdown, isSkillPlugin } from '../skillBundle';
import { getSkillFileMimeType, isBlockedSkillFile, normalizeSkillFilePath } from '../skillFiles';
import { isSkillHandleTaken } from '../skillInvocation';
import { SKILL_DESCRIPTION_MAX_LENGTH, SKILL_NAME_MAX_LENGTH, getSkillHandle } from '../skillMarkdown';
import { loadSkillFiles, saveSkill } from '../skillsThunks';
import { SKILL_MARKDOWN_PATH, type Skill } from '../types';
import { SkillCodeView, type SkillCodeViewMode } from './SkillCodeView';
import { SkillFileTree } from './SkillFileTree';
import {
    type WorkspaceFile,
    isSkillMarkdown,
    sortWorkspaceFiles,
    toSkillFileDraft,
    toWorkspaceFile,
} from './skillWorkspace';

import './SkillEditorModal.scss';

interface SkillEditorModalProps extends ModalStateProps {
    /** Edits this skill when set, otherwise creates a new one. */
    skillId?: string;
    onSaved?: (skill: Skill) => void;
}

const getTooLongError = (maxLength: number) => c('collider_2025:Error').t`Use ${maxLength} characters or fewer`;

const newSkillMarkdown = (): WorkspaceFile => ({ path: SKILL_MARKDOWN_PATH, mimeType: 'text/markdown', text: '' });

export const SkillEditorModal = ({ skillId, onSaved, ...modalProps }: SkillEditorModalProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const existing = useLumoSelector((state) => (skillId ? state.skills.skills[skillId] : undefined));
    const allSkills = useLumoSelector((state) => state.skills.skills);

    const isPlugin = !!existing && isSkillPlugin(existing);
    const withRootMarkdown = !existing || hasRootSkillMarkdown(existing);
    const rootFiles = (): WorkspaceFile[] =>
        withRootMarkdown ? [{ ...newSkillMarkdown(), text: existing?.instructions ?? '' }] : [];

    const [name, setName] = useState(existing?.name ?? '');
    const [description, setDescription] = useState(existing?.description ?? '');
    const [files, setFiles] = useState<WorkspaceFile[]>(rootFiles);
    const [initialFiles, setInitialFiles] = useState<WorkspaceFile[]>(files);
    const [loadingFiles, setLoadingFiles] = useState(!!skillId);
    const [activePath, setActivePath] = useState(SKILL_MARKDOWN_PATH);
    const [mode, setMode] = useState<SkillCodeViewMode>('code');
    const [newPath, setNewPath] = useState<string | undefined>(undefined);
    const [newPathError, setNewPathError] = useState<string>();
    const [showErrors, setShowErrors] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!skillId) {
            return;
        }
        let cancelled = false;
        void dispatch(loadSkillFiles(skillId))
            .then((loaded) => {
                if (cancelled) return;
                const next = [...rootFiles(), ...loaded.map(toWorkspaceFile)];
                setFiles(next);
                setInitialFiles(next);
            })
            .catch(() => {
                createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not load the skill files` });
            })
            .finally(() => {
                if (!cancelled) setLoadingFiles(false);
            });
        return () => {
            cancelled = true;
        };
    }, [skillId]);

    const sortedFiles = useMemo(() => sortWorkspaceFiles(files), [files]);
    const activeFile: WorkspaceFile | undefined =
        files.find((file) => file.path === activePath) ??
        sortedFiles.find((file) => file.path === README_PATH) ??
        sortedFiles[0];
    const showTree = files.length > 1 || newPath !== undefined || !withRootMarkdown;

    const modifiedPaths = useMemo(() => {
        const initialByPath = new Map(initialFiles.map((file) => [file.path, file]));
        return new Set(
            files
                .filter((file) => {
                    const initial = initialByPath.get(file.path);
                    return !initial || initial.text !== file.text;
                })
                .map(({ path }) => path)
        );
    }, [files, initialFiles]);

    const nameError = !name.trim()
        ? c('collider_2025:Error').t`Add a name`
        : name.length > SKILL_NAME_MAX_LENGTH
          ? getTooLongError(SKILL_NAME_MAX_LENGTH)
          : undefined;
    const handle = getSkillHandle(name);
    const handleWarning = (() => {
        if (isPlugin || !name.trim()) {
            return undefined;
        }
        if (!handle) {
            return c('collider_2025:Info').t`Add a letter or number to the name to invoke this skill with /`;
        }
        if (isSkillHandleTaken(name, Object.values(allSkills), skillId)) {
            return c('collider_2025:Info')
                .t`Another skill is also invoked with /${handle}, so only one of them can be used. Rename one of them.`;
        }
        return undefined;
    })();
    const descriptionError = !description.trim()
        ? c('collider_2025:Error').t`Add a description so ${LUMO_SHORT_APP_NAME} knows when to use this skill`
        : description.length > SKILL_DESCRIPTION_MAX_LENGTH
          ? getTooLongError(SKILL_DESCRIPTION_MAX_LENGTH)
          : undefined;

    const updateActiveText = (text: string) => {
        setFiles((prev) => prev.map((file) => (file.path === activeFile?.path ? { ...file, text } : file)));
    };

    const commitNewPath = () => {
        if (newPath === undefined || !newPath.trim()) {
            setNewPath(undefined);
            setNewPathError(undefined);
            return;
        }
        const path = normalizeSkillFilePath(newPath);
        if (!path) {
            setNewPathError(c('collider_2025:Error').t`Use a relative path, like references/guide.md`);
            return;
        }
        if (files.some((file) => file.path === path)) {
            setNewPathError(c('collider_2025:Error').t`A file with this path already exists`);
            return;
        }
        if (isBlockedSkillFile(path)) {
            setNewPathError(c('collider_2025:Error').t`Executable files are not allowed in skills`);
            return;
        }
        setFiles((prev) => [...prev, { path, mimeType: getSkillFileMimeType(path), text: '' }]);
        setActivePath(path);
        setNewPath(undefined);
        setNewPathError(undefined);
    };

    const removeActiveFile = () => {
        if (!activeFile || isSkillMarkdown(activeFile)) {
            return;
        }
        setFiles((prev) => prev.filter((file) => file.path !== activeFile.path));
        setActivePath(SKILL_MARKDOWN_PATH);
    };

    const copyActiveFile = async () => {
        if (activeFile?.text === undefined) return;
        try {
            await navigator.clipboard.writeText(activeFile.text);
            createNotification({ text: c('collider_2025:Info').t`Copied to clipboard` });
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not copy to clipboard` });
        }
    };

    const handleSave = async () => {
        setShowErrors(true);
        if (nameError || descriptionError || loadingFiles) {
            return;
        }
        const markdown = files.find(isSkillMarkdown);
        const rest = files.filter((file) => !isSkillMarkdown(file));
        setSaving(true);
        try {
            const skill = await dispatch(
                saveSkill({
                    id: skillId,
                    draft: {
                        name: name.trim(),
                        description: description.trim(),
                        instructions: markdown?.text ?? '',
                        icon: existing?.icon,
                        source: existing?.source ?? 'created',
                        metadata: existing?.metadata,
                        conversationStarters: existing?.conversationStarters,
                        files: rest.map(toSkillFileDraft),
                    },
                })
            ).unwrap();
            onSaved?.(skill);
            modalProps.onClose?.();
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not save the skill` });
        } finally {
            setSaving(false);
        }
    };

    const fileActions = activeFile && (
        <div className="flex flex-nowrap items-center gap-1 shrink-0">
            {/\.(md|markdown)$/i.test(activeFile.path) && (
                <div className="skill-editor__mode-toggle flex flex-nowrap" role="group">
                    <Button
                        icon
                        size="small"
                        shape="ghost"
                        className={clsx(mode === 'preview' && 'is-active')}
                        aria-pressed={mode === 'preview'}
                        aria-label={c('collider_2025:Action').t`Preview`}
                        onClick={() => setMode('preview')}
                    >
                        <LumoIcon name="Eye" size={16} />
                    </Button>
                    <Button
                        icon
                        size="small"
                        shape="ghost"
                        className={clsx(mode === 'code' && 'is-active')}
                        aria-pressed={mode === 'code'}
                        aria-label={c('collider_2025:Action').t`Edit source`}
                        onClick={() => setMode('code')}
                    >
                        <LumoIcon name="CodeXml" size={16} />
                    </Button>
                </div>
            )}
            {!isSkillMarkdown(activeFile) && (
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    aria-label={c('collider_2025:Action').t`Delete file`}
                    onClick={removeActiveFile}
                >
                    <LumoIcon name="Trash" size={16} />
                </Button>
            )}
            {activeFile.text !== undefined && (
                <Button
                    icon
                    size="small"
                    shape="ghost"
                    aria-label={c('collider_2025:Action').t`Copy`}
                    onClick={copyActiveFile}
                >
                    <LumoIcon name="Copy" size={16} />
                </Button>
            )}
        </div>
    );

    const codeView = activeFile && (
        <SkillCodeView
            file={activeFile}
            mode={mode}
            onChange={updateActiveText}
            placeholder={
                isSkillMarkdown(activeFile)
                    ? c('collider_2025:Placeholder')
                          .t`Summarize my recent work in three sections: wins, blockers, and next steps. Keep the tone professional but not stiff...`
                    : undefined
            }
            filePaths={sortedFiles.map((file) => file.path)}
            onOpenFile={setActivePath}
        />
    );

    let modalTitle = c('collider_2025:Title').t`Create a skill`;
    if (isPlugin) {
        modalTitle = c('collider_2025:Title').t`Edit plugin`;
    } else if (existing) {
        modalTitle = c('collider_2025:Title').t`Edit skill`;
    }

    return (
        <ModalTwo {...modalProps} size="xlarge">
            <ModalTwoHeader title={modalTitle} />
            <ModalTwoContent className="flex flex-column flex-nowrap gap-3">
                <InputFieldTwo
                    label={isPlugin ? c('collider_2025:Label').t`Plugin name` : c('collider_2025:Label').t`Skill name`}
                    placeholder={c('collider_2025:Placeholder').t`Weekly status report`}
                    value={name}
                    onValue={setName}
                    error={showErrors ? nameError : undefined}
                    warning={handleWarning}
                    maxLength={SKILL_NAME_MAX_LENGTH}
                    dense
                />
                <InputFieldTwo
                    as={TextAreaTwo}
                    rows={2}
                    label={c('collider_2025:Label').t`Description`}
                    placeholder={c('collider_2025:Placeholder')
                        .t`Generate weekly status reports from recent work. Use when asked for updates or progress summaries.`}
                    value={description}
                    onValue={setDescription}
                    error={showErrors ? descriptionError : undefined}
                    maxLength={SKILL_DESCRIPTION_MAX_LENGTH}
                    dense
                />
                <div
                    className={clsx(
                        'skill-editor__workspace flex flex-nowrap',
                        showTree && 'skill-editor__workspace--split'
                    )}
                >
                    {showTree ? (
                        <>
                            <SkillFileTree
                                files={sortedFiles}
                                activePath={activeFile?.path ?? ''}
                                onSelect={setActivePath}
                                modifiedPaths={modifiedPaths}
                                footer={
                                    <button
                                        type="button"
                                        className="skill-editor__add-file flex flex-nowrap items-center gap-2 border-none bg-transparent"
                                        onClick={() => setNewPath('')}
                                    >
                                        <LumoIcon name="Plus" size={14} />
                                        {c('collider_2025:Action').t`Add file`}
                                    </button>
                                }
                            >
                                {newPath !== undefined && (
                                    <li className="px-1 pt-1">
                                        <Input
                                            autoFocus
                                            value={newPath}
                                            onValue={(value) => {
                                                setNewPath(value);
                                                setNewPathError(undefined);
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') commitNewPath();
                                                if (event.key === 'Escape') {
                                                    setNewPath(undefined);
                                                    setNewPathError(undefined);
                                                }
                                            }}
                                            onBlur={commitNewPath}
                                            placeholder="path/to/file.md"
                                            aria-label={c('collider_2025:Label').t`New file path`}
                                            error={!!newPathError}
                                        />
                                        {newPathError && (
                                            <p className="m-0 mt-1 text-xs color-danger">{newPathError}</p>
                                        )}
                                    </li>
                                )}
                            </SkillFileTree>
                            <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                                <div className="skill-editor__file-header flex flex-nowrap items-center gap-2">
                                    <span className="flex-1 text-ellipsis text-monospace text-sm">
                                        {activeFile ? `/${activeFile.path}` : ''}
                                    </span>
                                    {fileActions}
                                </div>
                                <div className="flex-1 min-h-0">{codeView}</div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                            <div className="skill-editor__file-header skill-editor__file-header--single flex flex-nowrap items-center justify-end gap-2">
                                <Button size="small" shape="ghost" onClick={() => setNewPath('')}>
                                    <span className="flex flex-nowrap items-center gap-1">
                                        <LumoIcon name="Plus" size={14} />
                                        {c('collider_2025:Action').t`Add file`}
                                    </span>
                                </Button>
                                {fileActions}
                            </div>
                            <div className="flex-1 min-h-0">{codeView}</div>
                        </div>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <span className="skill-editor__status text-xs color-weak">
                    {loadingFiles
                        ? c('collider_2025:Info').t`Loading…`
                        : existing
                          ? null
                          : c('collider_2025:Info').t`Draft`}
                </span>
                <div className="flex flex-nowrap gap-2">
                    <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Cancel`}</Button>
                    <Button color="norm" onClick={handleSave} loading={saving} disabled={loadingFiles}>
                        {existing ? c('collider_2025:Action').t`Save` : c('collider_2025:Action').t`Create`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
