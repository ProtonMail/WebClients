import { useEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { sendSkillAddedEvent } from '../../../util/telemetry';
import { DEFAULT_AGENT_ICON } from '../../agents/constants';
import { IconPicker } from '../../projects/components/IconPicker';
import {
    CONNECTORS_MARKDOWN_PATH,
    README_PATH,
    deriveBundleInfo,
    hasRootSkillMarkdown,
    isSkillPlugin,
    isSubSkillMarkdownPath,
    resolvePluginInfo,
} from '../skillBundle';
import { getSkillWeight } from '../skillEntitlements';
import { MAX_SKILL_FILE_BYTES, MAX_SKILL_FILE_COUNT, MAX_SKILL_TOTAL_BYTES, getSkillFileMimeType } from '../skillFiles';
import { type GeneratedSkill, generateSkill } from '../skillGeneration';
import { isSkillHandleTaken } from '../skillInvocation';
import { SKILL_DESCRIPTION_MAX_LENGTH, SKILL_NAME_MAX_LENGTH, getSkillHandle } from '../skillMarkdown';
import {
    getConnectorsMarkdownTemplate,
    getSkillInstructionsTemplate,
    getSkillSetReadmeTemplate,
    getSubSkillMarkdownTemplate,
} from '../skillTemplate';
import { loadSkillFiles, saveSkill } from '../skillsThunks';
import { SKILL_MARKDOWN_PATH, type Skill } from '../types';
import { useSkillLimit } from '../useSkillLimit';
import { DeleteSkillFilePrompt } from './DeleteSkillFilePrompt';
import { SkillAddMenu } from './SkillAddMenu';
import { SkillCodeView, type SkillCodeViewMode } from './SkillCodeView';
import { SkillFileTree } from './SkillFileTree';
import type { SkillFileTreeEdit } from './SkillFileTree';
import { SkillLimitModal } from './SkillLimitModal';
import { SkillLumoBrief, SkillLumoPrompt } from './SkillLumoPrompt';
import {
    createWorkspaceEntry,
    getAvailableFolderPath,
    getParentFolder,
    isSkillMarkdown,
    removeWorkspaceEntry,
    renameWorkspaceEntry,
    sortWorkspaceFiles,
    toSkillFileDraft,
    toWorkspaceFile,
} from './skillWorkspace';
import type { Workspace, WorkspaceEntryKind, WorkspaceFile, WorkspacePathError } from './skillWorkspace';

import './SkillEditorModal.scss';

interface SkillEditorModalProps extends ModalStateProps {
    /** Edits this skill when set, otherwise creates a new one. */
    skillId?: string;
    onSaved?: (skill: Skill) => void;
}

const getTooLongError = (maxLength: number) => c('collider_2025:Error').t`Use ${maxLength} characters or fewer`;

const getCharacterCount = (value: string, maxLength: number) =>
    `${value.length.toLocaleString()} / ${maxLength.toLocaleString()}`;

const getLimitsSummary = () => {
    const fileCount = MAX_SKILL_FILE_COUNT;
    const fileSize = humanSize({ bytes: MAX_SKILL_FILE_BYTES, unit: 'MB', fraction: 0 });
    const totalSize = humanSize({ bytes: MAX_SKILL_TOTAL_BYTES, unit: 'MB', fraction: 0 });
    return c('collider_2025:Info').t`Up to ${fileCount} files · ${fileSize} each · ${totalSize} total`;
};

const getFileBytes = (file: WorkspaceFile) =>
    file.text !== undefined ? new TextEncoder().encode(file.text).byteLength : (file.data?.byteLength ?? 0);

/** What this skill uses of its limits; SKILL.md doesn't count towards the file limit. */
const getUsage = (files: WorkspaceFile[]) => {
    const otherFiles = files.filter((file) => !isSkillMarkdown(file));
    const sizes = files.map(getFileBytes);
    const totalBytes = sizes.reduce((total, size) => total + size, 0);
    const fileCount = otherFiles.length;
    const used = humanSize({ bytes: totalBytes });
    const max = humanSize({ bytes: MAX_SKILL_TOTAL_BYTES, unit: 'MB', fraction: 0 });
    const fileLabel = fileCount
        ? c('collider_2025:Info').ngettext(msgid`${fileCount} file`, `${fileCount} files`, fileCount)
        : undefined;
    const size = c('collider_2025:Info').t`${used} of ${max}`;
    return {
        text: fileLabel ? `${fileLabel} · ${size}` : size,
        overLimit:
            fileCount > MAX_SKILL_FILE_COUNT ||
            totalBytes > MAX_SKILL_TOTAL_BYTES ||
            sizes.some((bytes) => bytes > MAX_SKILL_FILE_BYTES),
    };
};

const newSkillMarkdown = (): WorkspaceFile => ({ path: SKILL_MARKDOWN_PATH, mimeType: 'text/markdown', text: '' });

const isInFolder = (folder: string, path: string) => path.startsWith(`${folder}/`);

const SKILLS_FOLDER = 'skills';

export const SkillEditorModal = ({ skillId, onSaved, ...modalProps }: SkillEditorModalProps) => {
    const api = useApi();
    const dispatch = useLumoDispatch();
    const { checkCanAddSkills, skillLimitModal, skillLimitModalState } = useSkillLimit();
    const { createNotification } = useNotifications();
    const existing = useLumoSelector((state) => (skillId ? state.skills.skills[skillId] : undefined));
    const allSkills = useLumoSelector((state) => state.skills.skills);

    const isPlugin = !!existing && isSkillPlugin(existing);
    const withRootMarkdown = !existing || hasRootSkillMarkdown(existing);
    // Only a skill written from scratch starts from the template; an existing one keeps its own text.
    const rootFiles = (): WorkspaceFile[] =>
        withRootMarkdown
            ? [{ ...newSkillMarkdown(), text: existing ? existing.instructions : getSkillInstructionsTemplate() }]
            : [];

    const [name, setName] = useState(existing?.name ?? '');
    const [description, setDescription] = useState(existing?.description ?? '');
    const [icon, setIcon] = useState(existing?.icon);
    const [files, setFiles] = useState<WorkspaceFile[]>(rootFiles);
    const [initialFiles, setInitialFiles] = useState<WorkspaceFile[]>(files);
    const usage = useMemo(() => getUsage(files), [files]);
    const [loadingFiles, setLoadingFiles] = useState(!!skillId);
    const [activePath, setActivePath] = useState(SKILL_MARKDOWN_PATH);
    const [mode, setMode] = useState<SkillCodeViewMode>('code');
    const [folders, setFolders] = useState<string[]>([]);
    // The folder highlighted in the tree; unset, new files go next to the open file.
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const [treeEdit, setTreeEdit] = useState<SkillFileTreeEdit>();
    const [pendingRemoval, setPendingRemoval] = useState<{ path: string; entry: WorkspaceEntryKind }>();
    const deletePrompt = useModalStateObject();
    const [showErrors, setShowErrors] = useState(false);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<'describe' | 'edit'>(existing ? 'edit' : 'describe');
    const [brief, setBrief] = useState('');
    const [lumoRequest, setLumoRequest] = useState('');
    const [lumoPromptOpen, setLumoPromptOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [undoDraft, setUndoDraft] = useState<GeneratedSkill>();
    const generationRef = useRef<AbortController>(undefined);

    useEffect(() => () => generationRef.current?.abort(), []);

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
    const needsTree = files.length > 1 || folders.length > 0 || treeEdit !== undefined || !withRootMarkdown;
    // Once the file tree is shown, it stays, even if a new file is cancelled or every other file is deleted.
    const [keepTree, setKeepTree] = useState(needsTree);
    useEffect(() => {
        if (needsTree) setKeepTree(true);
    }, [needsTree]);
    const showTree = needsTree || keepTree;

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
    // A skill set, existing or being made by adding a skill to it, has no /handle of its own: its skills do.
    const isSkillSet = isPlugin || files.some((file) => isSubSkillMarkdownPath(file.path));
    const handle = getSkillHandle(name);
    const handleWarning = (() => {
        if (isSkillSet || !name.trim()) {
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
        setUndoDraft(undefined);
    };

    const instructions = files.find(isSkillMarkdown)?.text ?? '';
    // An untouched template is no instructions yet: it isn't sent to Lumo as a draft, nor saved.
    const ownInstructions = !existing && instructions === getSkillInstructionsTemplate() ? '' : instructions;
    const hasDraft = !!(name.trim() || description.trim() || ownInstructions.trim());

    const applyDraft = (draft: GeneratedSkill) => {
        setName(draft.name);
        setDescription(draft.description);
        setFiles((prev) => prev.map((file) => (isSkillMarkdown(file) ? { ...file, text: draft.instructions } : file)));
    };

    /** From the first step, Lumo writes a new skill; from the editor, it revises the current one. */
    const handleGenerate = async (fromBrief: boolean) => {
        const request = (fromBrief ? brief : lumoRequest).trim();
        if (!request || generating) {
            return;
        }
        const previous: GeneratedSkill = { name, description, instructions };
        const revising = !fromBrief && hasDraft;
        const base: GeneratedSkill = revising
            ? { name, description, instructions: ownInstructions }
            : { name: '', description: '', instructions: '' };
        // Fields Lumo has not reached yet keep their previous value instead of blinking empty.
        const withBase = (draft: GeneratedSkill): GeneratedSkill => ({
            name: draft.name || base.name,
            description: draft.description || base.description,
            instructions: draft.instructions || base.instructions,
        });
        const controller = new AbortController();
        generationRef.current = controller;
        setGenerating(true);
        setShowErrors(false);
        setActivePath(SKILL_MARKDOWN_PATH);
        setMode('code');
        setStep('edit');
        applyDraft(base);
        try {
            const draft = await generateSkill(api, request, {
                current: revising ? base : undefined,
                signal: controller.signal,
                onUpdate: (partial) => applyDraft(withBase(partial)),
            });
            applyDraft(withBase(draft));
            setUndoDraft(hasDraft ? previous : undefined);
            if (!fromBrief) setLumoRequest('');
        } catch {
            if (controller.signal.aborted) {
                setUndoDraft(hasDraft ? previous : undefined);
                return;
            }
            applyDraft(previous);
            if (fromBrief) setStep('describe');
            createNotification({
                type: 'error',
                text: c('collider_2025:Error').t`${LUMO_SHORT_APP_NAME} could not write the skill. Try again.`,
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleUndo = () => {
        if (undoDraft) {
            applyDraft(undoDraft);
            setUndoDraft(undefined);
        }
    };

    const workspace: Workspace = { files, folders };
    const applyWorkspace = (next: Workspace) => {
        setFiles(next.files);
        setFolders(next.folders);
    };

    /** Where new files and folders go: the highlighted folder, else the folder of the open file. */
    const targetFolder = selectedFolder ?? getParentFolder(activeFile?.path ?? '');

    const selectFile = (path: string) => {
        setActivePath(path);
        setSelectedFolder(undefined);
    };

    const startCreate = (entry: WorkspaceEntryKind) => setTreeEdit({ kind: 'create', parent: targetFolder, entry });

    const getPathErrorText = (error: WorkspacePathError, entry: WorkspaceEntryKind) => {
        if (error === 'taken') {
            // translator: Error under the name field of a new or renamed file or folder in a skill.
            return c('collider_2025:Error').t`A file or folder with this name already exists`;
        }
        if (error === 'blocked') {
            // translator: Error under the name field when the file type is a program, such as an .exe file.
            return c('collider_2025:Error').t`Executable files are not allowed in skills`;
        }
        if (entry === 'folder') {
            // translator: Error under the name field of a folder in a skill. "references" is an example folder name.
            return c('collider_2025:Error').t`Use a valid folder name, like references`;
        }
        // translator: Error under the name field of a file in a skill. "notes.md" is an example file name.
        return c('collider_2025:Error').t`Use a valid file name, like notes.md`;
    };

    const commitTreeEdit = (entryName: string): string | undefined => {
        if (!treeEdit) {
            return undefined;
        }
        const result =
            treeEdit.kind === 'create'
                ? createWorkspaceEntry(workspace, treeEdit.parent, entryName, treeEdit.entry)
                : renameWorkspaceEntry(workspace, treeEdit.path, entryName, treeEdit.entry);
        if ('error' in result) {
            return getPathErrorText(result.error, treeEdit.entry);
        }
        applyWorkspace(result.workspace);
        if (treeEdit.kind === 'create' && treeEdit.entry === 'file') {
            selectFile(result.path);
        } else if (treeEdit.kind === 'create') {
            setSelectedFolder(result.path);
        } else {
            const { path } = treeEdit;
            const move = (other: string) =>
                other === path || isInFolder(path, other) ? `${result.path}${other.slice(path.length)}` : other;
            setActivePath(move(activePath));
            setSelectedFolder((prev) => (prev === undefined ? prev : move(prev)));
        }
        setTreeEdit(undefined);
        return undefined;
    };

    const removeEntry = (path: string, entry: WorkspaceEntryKind) => {
        const isRemoved = (other: string) => other === path || (entry === 'folder' && isInFolder(path, other));
        applyWorkspace(removeWorkspaceEntry(workspace, path, entry));
        if (isRemoved(activePath)) {
            setActivePath(SKILL_MARKDOWN_PATH);
        }
        setSelectedFolder((prev) => (prev !== undefined && isRemoved(prev) ? undefined : prev));
        setTreeEdit(undefined);
    };

    // The root SKILL.md is the skill itself, and sub-skills are found in the `skills` folder.
    const canRenameEntry = (path: string, entry: WorkspaceEntryKind) =>
        entry === 'folder' ? path !== SKILLS_FOLDER : path !== SKILL_MARKDOWN_PATH;
    const canRemoveEntry = (path: string, entry: WorkspaceEntryKind) =>
        entry === 'folder' || path !== SKILL_MARKDOWN_PATH;

    /** Adds `skills/<folder>/SKILL.md`; the root SKILL.md becomes the README, as in a skill set. */
    const addSkill = () => {
        // translator: Default name of the folder of a skill added to a skill set, turned into a lowercase-hyphenated folder name.
        const defaultFolderName = c('collider_2025:Placeholder').t`New skill`;
        const base = getSkillHandle(defaultFolderName) || 'new-skill';
        const folder = getAvailableFolderPath(workspace, SKILLS_FOLDER, base);
        if (!folder) {
            const skillsFolder = SKILLS_FOLDER;
            createNotification({
                type: 'error',
                // translator: Error when a skill can't be added to a skill set because a file has the name of the folder skills go in. ${skillsFolder} is that folder name, "skills".
                text: c('collider_2025:Error')
                    .t`A file named "${skillsFolder}" is in the way. Rename or delete it to add a skill.`,
            });
            return;
        }
        const path = `${folder}/${SKILL_MARKDOWN_PATH}`;
        const root = files.find(isSkillMarkdown);
        const moveRoot = !!root && !files.some((file) => file.path === README_PATH);
        const readme = ownInstructions.trim() ? ownInstructions : getSkillSetReadmeTemplate(name, description);
        setFiles((prev) => [
            ...prev.map((file) =>
                moveRoot && isSkillMarkdown(file) ? { ...file, path: README_PATH, text: readme } : file
            ),
            {
                path,
                mimeType: getSkillFileMimeType(path),
                text: getSubSkillMarkdownTemplate(folder.slice(SKILLS_FOLDER.length + 1)),
            },
        ]);
        selectFile(path);
        setMode('code');
        setTreeEdit({ kind: 'rename', path: folder, entry: 'folder' });
    };

    const addConnectors = () => {
        if (!files.some((file) => file.path === CONNECTORS_MARKDOWN_PATH)) {
            const text = getConnectorsMarkdownTemplate();
            setFiles((prev) => [
                ...prev,
                { path: CONNECTORS_MARKDOWN_PATH, mimeType: getSkillFileMimeType(CONNECTORS_MARKDOWN_PATH), text },
            ]);
        }
        setTreeEdit(undefined);
        selectFile(CONNECTORS_MARKDOWN_PATH);
    };

    const confirmRemoval = (path: string, entry: WorkspaceEntryKind) => {
        setPendingRemoval({ path, entry });
        deletePrompt.openModal(true);
    };

    const removeActiveFile = () => {
        if (activeFile && canRemoveEntry(activeFile.path, 'file')) {
            confirmRemoval(activeFile.path, 'file');
        }
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
        const rest = files.filter((file) => !isSkillMarkdown(file));
        const draftFiles = rest.map(toSkillFileDraft);
        const bundle = deriveBundleInfo(draftFiles, existing?.subSkills);
        const draftSkill = {
            ...bundle,
            plugin: resolvePluginInfo(existing?.source ?? 'created', bundle.plugin, existing?.plugin),
            instructions: ownInstructions,
        };
        const becomesPlugin = isSkillPlugin(draftSkill);
        const enabled = existing?.enabled ?? true;
        const currentWeight = existing && enabled ? getSkillWeight(existing) : 0;
        const draftWeight = enabled ? getSkillWeight(draftSkill) : 0;
        const added = draftWeight - currentWeight;
        if ((!existing || (!isPlugin && becomesPlugin) || added > 0) && !checkCanAddSkills(added, becomesPlugin)) {
            return;
        }
        setSaving(true);
        try {
            const skill = await dispatch(
                saveSkill({
                    id: skillId,
                    draft: {
                        name: name.trim(),
                        description: description.trim(),
                        instructions: ownInstructions,
                        icon,
                        source: existing?.source ?? 'created',
                        metadata: existing?.metadata,
                        conversationStarters: existing?.conversationStarters,
                        files: draftFiles,
                    },
                })
            ).unwrap();
            if (!skillId) {
                sendSkillAddedEvent({ source: 'editor' });
            }
            onSaved?.(skill);
            modalProps.onClose?.();
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not save the skill` });
        } finally {
            setSaving(false);
        }
    };

    const addMenu = (variant: 'header' | 'footer') => (
        <SkillAddMenu
            variant={variant}
            targetFolder={targetFolder}
            onAddFile={() => startCreate('file')}
            onAddFolder={() => startCreate('folder')}
            onAddSkill={addSkill}
            onAddConnectors={addConnectors}
        />
    );

    const fileActions = activeFile && (
        <div className="flex flex-nowrap items-center gap-1 shrink-0">
            {/\.(md|markdown)$/i.test(activeFile.path) && (
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                <div className="skill-editor__mode-toggle p-0.5 flex flex-nowrap radius-8 lumo-bg-panel" role="group">
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
            {!showTree && addMenu('header')}
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
            onChange={generating ? undefined : updateActiveText}
            placeholder={
                isSkillMarkdown(activeFile)
                    ? c('collider_2025:Placeholder')
                          .t`Summarize my recent work in three sections: wins, blockers, and next steps. Keep the tone professional but not stiff...`
                    : undefined
            }
            filePaths={sortedFiles.map((file) => file.path)}
            onOpenFile={selectFile}
        />
    );

    let modalTitle = c('collider_2025:Title').t`Create a skill`;
    if (isPlugin) {
        modalTitle = c('collider_2025:Title').t`Edit skill set`;
    } else if (existing) {
        modalTitle = c('collider_2025:Title').t`Edit skill`;
    } else if (step === 'edit') {
        modalTitle = c('collider_2025:Title').t`Write a skill`;
    }

    // Lumo writes the root SKILL.md, so it is offered only while the skill has one and is not a skill set.
    const canUseLumo = files.some(isSkillMarkdown) && !isSkillSet;
    const showLumoPrompt = canUseLumo && (lumoPromptOpen || generating || !!undoDraft);

    const describeStep = (
        <>
            <ModalTwoContent>
                <SkillLumoBrief value={brief} onValue={setBrief} onSubmit={() => handleGenerate(true)} />
            </ModalTwoContent>
            <ModalTwoFooter className="items-center">
                <Button shape="ghost" onClick={() => setStep('edit')}>
                    {c('collider_2025:Action').t`Skip and write it myself`}
                </Button>
                <Button color="norm" onClick={() => handleGenerate(true)} disabled={!brief.trim()}>
                    <span className="flex flex-nowrap items-center gap-2">
                        <LumoIcon name="Sparkles" size={16} />
                        {c('collider_2025:Action').t`Draft with ${LUMO_SHORT_APP_NAME}`}
                    </span>
                </Button>
            </ModalTwoFooter>
        </>
    );

    const editStep = (
        <>
            <ModalTwoContent className="flex flex-column flex-nowrap gap-3">
                <InputFieldTwo
                    dir="auto"
                    label={
                        isSkillSet ? c('collider_2025:Label').t`Skill set name` : c('collider_2025:Label').t`Skill name`
                    }
                    hint={getCharacterCount(name, SKILL_NAME_MAX_LENGTH)}
                    prefix={
                        <IconPicker
                            size="small"
                            selectedIcon={icon ?? DEFAULT_AGENT_ICON}
                            onSelectIcon={setIcon}
                            disabled={generating}
                            label={c('collider_2025:Action').t`Choose skill icon`}
                        />
                    }
                    placeholder={c('collider_2025:Placeholder').t`Weekly status report`}
                    value={name}
                    onValue={(value: string) => {
                        setName(value);
                        setUndoDraft(undefined);
                    }}
                    readOnly={generating}
                    error={showErrors ? nameError : undefined}
                    warning={handleWarning}
                    maxLength={SKILL_NAME_MAX_LENGTH}
                    dense
                />
                <InputFieldTwo
                    dir="auto"
                    as={TextAreaTwo}
                    rows={2}
                    label={c('collider_2025:Label').t`Description`}
                    hint={getCharacterCount(description, SKILL_DESCRIPTION_MAX_LENGTH)}
                    placeholder={c('collider_2025:Placeholder')
                        .t`Generate weekly status reports from recent work. Use when asked for updates or progress summaries.`}
                    value={description}
                    onValue={(value: string) => {
                        setDescription(value);
                        setUndoDraft(undefined);
                    }}
                    readOnly={generating}
                    error={showErrors ? descriptionError : undefined}
                    maxLength={SKILL_DESCRIPTION_MAX_LENGTH}
                    dense
                />
                <div
                    className={clsx(
                        'skill-editor__workspace flex flex-column flex-nowrap border lumo-border radius-12 lumo-bg-control-fill',
                        showTree && 'skill-editor__workspace--split'
                    )}
                >
                    <div className="skill-editor__panel-header py-2 px-3 flex flex-nowrap items-center gap-2">
                        <span className="flex-1 lumo-body-small text-ellipsis lumo-color-glyph-mid">
                            {showTree
                                ? c('collider_2025:Label').t`Files`
                                : c('collider_2025:Label').t`Instructions · ${SKILL_MARKDOWN_PATH}`}
                        </span>
                        {canUseLumo && !showLumoPrompt && (
                            <Button size="small" shape="outline" onClick={() => setLumoPromptOpen(true)}>
                                <span className="flex flex-nowrap items-center gap-1">
                                    <LumoIcon name="Sparkles" size={14} />
                                    {c('collider_2025:Action').t`Improve with ${LUMO_SHORT_APP_NAME}`}
                                </span>
                            </Button>
                        )}
                        {!showTree && <>{fileActions}</>}
                    </div>
                    {showLumoPrompt && (
                        <div className="px-3">
                            <SkillLumoPrompt
                                value={lumoRequest}
                                onValue={setLumoRequest}
                                onSubmit={() => handleGenerate(false)}
                                onStop={() => generationRef.current?.abort()}
                                generating={generating}
                                hasDraft={hasDraft}
                                onUndo={undoDraft ? handleUndo : undefined}
                            />
                        </div>
                    )}
                    <div
                        className={clsx(
                            'skill-editor__body flex flex-nowrap flex-1 min-h-0',
                            showTree && 'skill-editor__body--split'
                        )}
                    >
                        {showTree ? (
                            <>
                                <SkillFileTree
                                    files={sortedFiles}
                                    folders={folders}
                                    activePath={activeFile?.path ?? ''}
                                    selectedFolder={selectedFolder}
                                    onSelectFile={selectFile}
                                    onSelectFolder={setSelectedFolder}
                                    modifiedPaths={modifiedPaths}
                                    footer={addMenu('footer')}
                                    edit={treeEdit}
                                    onStartRename={(path, entry) => setTreeEdit({ kind: 'rename', path, entry })}
                                    onRemove={confirmRemoval}
                                    onCommitEdit={commitTreeEdit}
                                    onCancelEdit={() => setTreeEdit(undefined)}
                                    canRename={canRenameEntry}
                                    canRemove={canRemoveEntry}
                                />
                                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                                    <div className="skill-editor__file-header py-2 px-3 flex flex-nowrap items-center gap-2">
                                        <span className="flex-1 lumo-body-small lumo-font-mono text-ellipsis">
                                            {activeFile ? `/${activeFile.path}` : ''}
                                        </span>
                                        {fileActions}
                                    </div>
                                    <div className="flex-1 min-h-0">{codeView}</div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 min-w-0 min-h-0">{codeView}</div>
                        )}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="items-center">
                <div className="flex flex-nowrap items-center gap-2 min-w-0">
                    {!existing && (
                        <span className="shrink-0 px-2 py-0.5 border lumo-border radius-8 lumo-label-small lumo-color-glyph-mid">
                            {c('collider_2025:Info').t`Draft`}
                        </span>
                    )}
                    <span
                        className={clsx(
                            'lumo-label-small text-ellipsis',
                            usage.overLimit ? 'lumo-color-signal-danger' : 'lumo-color-glyph-mid'
                        )}
                        title={getLimitsSummary()}
                    >
                        {usage.text}
                    </span>
                </div>
                <div className="flex flex-nowrap gap-2 shrink-0">
                    <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Cancel`}</Button>
                    <Button color="norm" onClick={handleSave} loading={saving} disabled={loadingFiles || generating}>
                        {existing ? c('collider_2025:Action').t`Save` : c('collider_2025:Action').t`Create`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </>
    );

    return (
        <>
            <ModalTwo {...modalProps} size="xlarge">
                <ModalTwoHeader title={modalTitle} />
                {step === 'describe' ? describeStep : editStep}
            </ModalTwo>
            {deletePrompt.render && pendingRemoval && (
                <DeleteSkillFilePrompt
                    {...deletePrompt.modalProps}
                    name={pendingRemoval.path.slice(pendingRemoval.path.lastIndexOf('/') + 1)}
                    entry={pendingRemoval.entry}
                    onConfirm={() => removeEntry(pendingRemoval.path, pendingRemoval.entry)}
                />
            )}
            {skillLimitModal.render && (
                <SkillLimitModal
                    {...skillLimitModal.modalProps}
                    {...skillLimitModalState}
                    isConvertingToPlugin={!!existing && !isPlugin}
                />
            )}
        </>
    );
};
