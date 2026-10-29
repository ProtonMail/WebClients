import { type DragEvent, useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch } from '../../redux/hooks';
import { findSubSkills } from '../skills/skillBundle';
import { type DroppedSkillItem, groupPickedFolderFiles, readDroppedItems } from '../skills/skillFolderInput';
import { type SkillImportResult, importSkillFiles, importSkillFolder } from '../skills/skillImport';
import { saveSkill } from '../skills/skillsThunks';
import { useSkills } from '../skills/useSkills';
import { CustomizePage } from './components/CustomizePage';
import { getSkillPath } from './skillRoutes';

import './UploadSkillView.scss';

const ACCEPTED_EXTENSIONS = '.md,.zip,.skill,.plugin';

const getResultSummary = ({ fileName, draft }: SkillImportResult) => {
    const skillCount = draft ? findSubSkills(draft.files).length : 0;
    if (!skillCount) {
        return fileName;
    }
    const skillCountLabel = c('collider_2025:Info').ngettext(
        msgid`${skillCount} skill`,
        `${skillCount} skills`,
        skillCount
    );
    return `${fileName} · ${skillCountLabel}`;
};

export const UploadSkillView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const { status } = useSkills();

    const history = useHistory();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<SkillImportResult[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const valid = results.filter((result) => result.draft);
    const hasErrors = results.some((result) => result.error);

    useEffect(() => {
        folderInputRef.current?.setAttribute('webkitdirectory', '');
    }, []);

    const addItems = async (items: DroppedSkillItem[]) => {
        if (!items.length) return;
        setParsing(true);
        try {
            const plainFiles = items.flatMap((item) => (item.kind === 'file' ? [item.file] : []));
            const folders = items.flatMap((item) => (item.kind === 'folder' ? [item] : []));
            const parsed = [
                ...(await importSkillFiles(plainFiles)),
                ...(await Promise.all(folders.map(({ name, files }) => importSkillFolder(name, files)))),
            ];
            const names = new Set(parsed.map((result) => result.fileName));
            setResults((prev) => [...prev.filter((result) => !names.has(result.fileName)), ...parsed]);
        } finally {
            setParsing(false);
        }
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        void addItems(await readDroppedItems(event.dataTransfer));
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const saved = [];
            for (const { draft } of valid) {
                if (draft) {
                    saved.push(await dispatch(saveSkill({ draft })).unwrap());
                }
            }
            createNotification({
                text: c('collider_2025:Info').ngettext(
                    msgid`${saved.length} skill added`,
                    `${saved.length} skills added`,
                    saved.length
                ),
            });
            history.push(saved.length === 1 ? getSkillPath(saved[0].id) : '/customize');
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not upload the skill` });
        } finally {
            setUploading(false);
        }
    };

    const scanStatus = parsing
        ? c('collider_2025:Info').t`Checking…`
        : results.length === 0
          ? c('collider_2025:Info').t`Runs when you upload`
          : hasErrors
            ? c('collider_2025:Info').t`Some files need attention`
            : c('collider_2025:Info').t`File types, paths and sizes look fine`;

    const footerHint =
        valid.length === 0
            ? c('collider_2025:Info').t`Choose a file to continue.`
            : c('collider_2025:Info').ngettext(
                  msgid`${valid.length} skill ready to upload.`,
                  `${valid.length} skills ready to upload.`,
                  valid.length
              );

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <CustomizePage className="gap-6">
                <Link to="/customize" className="flex items-center gap-2 color-norm text-no-decoration w-fit-content">
                    <LumoIcon name="ArrowLeft" size={16} className="rtl:mirror" />
                    {c('collider_2025:Link').t`Skills`}
                </Link>
                <div className="flex flex-column gap-1">
                    <h1 className="text-2xl text-semibold m-0">{c('collider_2025:Title').t`Upload a skill`}</h1>
                    <p className="m-0 color-weak">
                        {c('collider_2025:Info')
                            .t`Add a skill to your workspace. A security scan runs when you upload.`}
                    </p>
                </div>

                <div className="flex flex-column gap-2">
                    <span className="text-semibold" id="upload-skill-file-label">
                        {c('collider_2025:Label').t`Skill file`}
                    </span>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-labelledby="upload-skill-file-label"
                        className={clsx(
                            'upload-skill-dropzone flex flex-column items-center justify-center gap-3',
                            isDragging && 'is-dragging'
                        )}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                inputRef.current?.click();
                            }
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <LumoIcon aria-hidden name="Upload" size={18} />
                        <span className="text-sm">
                            {c('collider_2025:Info')
                                .t`Drag and drop skill files or folders here, or browse — you can add several at once`}
                        </span>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_EXTENSIONS}
                        className="hidden"
                        onChange={(event) => {
                            void addItems(Array.from(event.target.files ?? [], (file) => ({ kind: 'file', file })));
                            event.target.value = '';
                        }}
                    />
                    <input
                        ref={folderInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            void addItems(groupPickedFolderFiles(Array.from(event.target.files ?? [])));
                            event.target.value = '';
                        }}
                    />
                    <div className="flex flex-nowrap items-start justify-space-between gap-4">
                        <ul className="m-0 pl-5 text-sm color-weak">
                            <li>{c('collider_2025:Info')
                                .t`.md file must contain skill name and description formatted in YAML`}</li>
                            <li>{c('collider_2025:Info').t`.zip or .skill file must include a SKILL.md file`}</li>
                            <li>
                                {c('collider_2025:Info')
                                    .t`Folders and plugins can hold several skills, each in its own folder with a SKILL.md`}
                            </li>
                            <li>
                                {c('collider_2025:Info')
                                    .t`${LUMO_SHORT_APP_NAME} can read the scripts in a skill but won't run them`}
                            </li>
                        </ul>
                        <Button
                            size="small"
                            shape="outline"
                            className="shrink-0"
                            onClick={() => folderInputRef.current?.click()}
                        >
                            {c('collider_2025:Action').t`Choose a folder`}
                        </Button>
                    </div>
                </div>

                {results.length > 0 && (
                    <ul className="upload-skill-results m-0 p-0 list-none">
                        {results.map((result) => (
                            <li key={result.fileName} className="flex flex-nowrap items-start gap-3">
                                <LumoIcon
                                    aria-hidden
                                    name={result.error ? 'CircleAlert' : 'CircleCheck'}
                                    size={16}
                                    className={clsx('shrink-0 mt-0.5', result.error ? 'color-danger' : 'color-success')}
                                />
                                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                                    <span className="text-semibold text-ellipsis">
                                        {result.draft?.name ?? result.fileName}
                                    </span>
                                    <span className={clsx('text-sm', result.error ? 'color-danger' : 'color-weak')}>
                                        {result.error ?? getResultSummary(result)}
                                    </span>
                                </div>
                                <Button
                                    icon
                                    size="small"
                                    shape="ghost"
                                    aria-label={c('collider_2025:Action').t`Remove`}
                                    onClick={() =>
                                        setResults((prev) => prev.filter((r) => r.fileName !== result.fileName))
                                    }
                                >
                                    <LumoIcon name="X" size={14} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="upload-skill-scan flex flex-nowrap items-center justify-space-between gap-4">
                    <span>{c('collider_2025:Label').t`Security scan`}</span>
                    <span className="text-sm color-weak">{scanStatus}</span>
                </div>

                <div className="flex flex-nowrap items-center gap-3">
                    <Button
                        color="norm"
                        disabled={valid.length === 0 || parsing || status !== 'ready'}
                        loading={uploading}
                        onClick={handleUpload}
                    >
                        {c('collider_2025:Action').t`Upload`}
                    </Button>
                    <Button onClick={() => history.push('/customize')}>{c('collider_2025:Action').t`Cancel`}</Button>
                    <span className="text-sm color-weak">{footerHint}</span>
                </div>
            </CustomizePage>
        </LumoLayoutWithDrawer>
    );
};
