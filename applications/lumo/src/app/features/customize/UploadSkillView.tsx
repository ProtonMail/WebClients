import { type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Collapsible } from '@proton/atoms/Collapsible/Collapsible';
import { CollapsibleContent } from '@proton/atoms/Collapsible/CollapsibleContent';
import { CollapsibleHeader } from '@proton/atoms/Collapsible/CollapsibleHeader';
import { CollapsibleHeaderIconButton } from '@proton/atoms/Collapsible/CollapsibleHeaderIconButton';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { type IconName, LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch } from '../../redux/hooks';
import { findSubSkills } from '../skills/skillBundle';
import { type SkillCheckReport, checkSkill, getSkillCheckFindingText } from '../skills/skillCheck';
import { type DroppedSkillItem, groupPickedFolderFiles, readDroppedItems } from '../skills/skillFolderInput';
import { type SkillImportResult, importSkillFiles, importSkillFolder } from '../skills/skillImport';
import { saveSkill } from '../skills/skillsThunks';
import { useSkills } from '../skills/useSkills';
import { CustomizePage } from './components/CustomizePage';
import { getSkillPath } from './skillRoutes';

import './UploadSkillView.scss';

const ACCEPTED_EXTENSIONS = '.md,.zip,.skill,.plugin';

type CheckedResult = SkillImportResult & {
    report?: SkillCheckReport;
    /** Skills nested in a plugin or folder of skills; 0 for a single skill. */
    subSkillCount: number;
};

const getResultSummary = ({ fileName, subSkillCount }: CheckedResult) => {
    if (!subSkillCount) {
        return fileName;
    }
    const kind = c('collider_2025:Info').ngettext(
        msgid`Plugin with ${subSkillCount} skill`,
        `Plugin with ${subSkillCount} skills`,
        subSkillCount
    );
    return `${kind} · ${fileName}`;
};

const getReadyHint = (valid: CheckedResult[]) => {
    const plugins = valid.filter((result) => result.subSkillCount > 0);
    const skillCount = valid.reduce((total, result) => total + (result.subSkillCount || 1), 0);
    if (!plugins.length) {
        return c('collider_2025:Info').ngettext(
            msgid`${skillCount} skill ready to add.`,
            `${skillCount} skills ready to add.`,
            skillCount
        );
    }
    if (valid.length === 1) {
        return c('collider_2025:Info').ngettext(
            msgid`1 plugin with ${skillCount} skill ready to add.`,
            `1 plugin with ${skillCount} skills ready to add.`,
            skillCount
        );
    }
    const pluginCount = plugins.length;
    const pluginLabel = c('collider_2025:Info').ngettext(
        msgid`${pluginCount} plugin`,
        `${pluginCount} plugins`,
        pluginCount
    );
    // translator: ${pluginLabel} is "1 plugin" or "2 plugins"; the count is the number of skills they hold in total.
    return c('collider_2025:Info').ngettext(
        msgid`${skillCount} skill ready to add, including ${pluginLabel}.`,
        `${skillCount} skills ready to add, including ${pluginLabel}.`,
        skillCount
    );
};

const getAddLabel = (valid: CheckedResult[]) => {
    if (valid.length > 1) {
        return c('collider_2025:Action').t`Add all`;
    }
    return valid[0]?.subSkillCount ? c('collider_2025:Action').t`Add plugin` : c('collider_2025:Action').t`Add skill`;
};

const ResultNote = ({ icon, children }: { icon: IconName; children: ReactNode }) => (
    <div className="flex flex-nowrap items-start gap-2 text-sm color-weak">
        <LumoIcon aria-hidden name={icon} size={14} className="shrink-0 mt-0.5" />
        <span className="min-w-0 text-break">{children}</span>
    </div>
);

const ResultDetails = ({ report }: { report: SkillCheckReport }) => {
    const { findings, checkedFileCount, scriptCount, connectors, linkDomains } = report;
    const domains = linkDomains.join(', ');
    const connectorNames = connectors.join(', ');
    const connectorCount = connectors.length;
    return (
        <div className="upload-skill-result-details flex flex-column gap-2 mt-3">
            {!findings.length && (
                <div className="flex flex-nowrap items-start gap-2 text-sm">
                    <LumoIcon aria-hidden name="CircleCheck" size={14} className="shrink-0 mt-0.5 color-success" />
                    <span>
                        {c('collider_2025:Info').ngettext(
                            msgid`No problems found in ${checkedFileCount} file.`,
                            `No problems found in ${checkedFileCount} files.`,
                            checkedFileCount
                        )}
                    </span>
                </div>
            )}
            {findings.map((finding) => {
                const { title, detail } = getSkillCheckFindingText(finding.kind);
                const location = finding.line
                    ? c('collider_2025:Info').t`${finding.path}, line ${finding.line}`
                    : finding.path;
                return (
                    <div key={`${finding.kind}:${finding.path}`} className="flex flex-nowrap items-start gap-2">
                        <LumoIcon
                            aria-hidden
                            name="TriangleExclamationPoint"
                            size={14}
                            className="shrink-0 mt-0.5 color-warning"
                        />
                        <div className="flex flex-column min-w-0 text-sm">
                            <span className="text-semibold">{title}</span>
                            <span className="color-weak">{detail}</span>
                            <span className="color-hint text-ellipsis" title={location}>
                                {location}
                            </span>
                        </div>
                    </div>
                );
            })}
            {connectorCount > 0 && (
                <ResultNote icon="Plug">
                    {c('collider_2025:Info').ngettext(
                        msgid`Sets up ${connectorCount} connector: ${connectorNames}. Nothing connects until you set it up in ${LUMO_SHORT_APP_NAME} Desktop.`,
                        `Sets up ${connectorCount} connectors: ${connectorNames}. Nothing connects until you set them up in ${LUMO_SHORT_APP_NAME} Desktop.`,
                        connectorCount
                    )}
                </ResultNote>
            )}
            {scriptCount > 0 && (
                <ResultNote icon="FileCode">
                    {c('collider_2025:Info').ngettext(
                        msgid`Includes ${scriptCount} script. ${LUMO_SHORT_APP_NAME} can read it but won't run it.`,
                        `Includes ${scriptCount} scripts. ${LUMO_SHORT_APP_NAME} can read them but won't run them.`,
                        scriptCount
                    )}
                </ResultNote>
            )}
            {linkDomains.length > 0 && (
                <ResultNote icon="Link">{c('collider_2025:Info').t`Links to ${domains}`}</ResultNote>
            )}
        </div>
    );
};

export const UploadSkillView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const { status } = useSkills();

    const history = useHistory();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [imports, setImports] = useState<SkillImportResult[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const results = useMemo(
        (): CheckedResult[] =>
            imports.map((result) =>
                result.draft
                    ? {
                          ...result,
                          report: checkSkill(result.draft),
                          subSkillCount: findSubSkills(result.draft.files).length,
                      }
                    : { ...result, subSkillCount: 0 }
            ),
        [imports]
    );
    const valid = results.filter((result) => result.draft);
    const findingCount = valid.reduce((total, result) => total + (result.report?.findings.length ?? 0), 0);

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
            setImports((prev) => [...prev.filter((result) => !names.has(result.fileName)), ...parsed]);
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
            const [first] = saved;
            createNotification({
                text:
                    saved.length === 1
                        ? c('collider_2025:Info').t`Added ${first.name}`
                        : c('collider_2025:Info').t`Added ${saved.length} uploads to your skills`,
            });
            history.push(saved.length === 1 ? getSkillPath(saved[0].id) : '/customize');
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not upload the skill` });
        } finally {
            setUploading(false);
        }
    };

    const checkStatus = (() => {
        if (parsing) {
            return c('collider_2025:Info').t`Checking…`;
        }
        if (!valid.length) {
            return c('collider_2025:Info').t`Runs when you add files`;
        }
        if (findingCount) {
            return c('collider_2025:Info').ngettext(
                msgid`${findingCount} thing to review`,
                `${findingCount} things to review`,
                findingCount
            );
        }
        return c('collider_2025:Info').t`Nothing unusual found`;
    })();

    const footerHint = (() => {
        if (!valid.length) {
            return c('collider_2025:Info').t`Add a file to continue.`;
        }
        if (findingCount) {
            return c('collider_2025:Info').t`Review the flagged items before you add them.`;
        }
        return getReadyHint(valid);
    })();

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
                            .t`Add skills you've written or downloaded. ${LUMO_SHORT_APP_NAME} checks each one before you add it.`}
                    </p>
                </div>

                <div className="flex flex-column gap-3">
                    {/* Drop target for mouse users; the buttons inside are the keyboard path. */}
                    <div
                        className={clsx(
                            'upload-skill-dropzone flex flex-column items-center justify-center gap-3',
                            isDragging && 'is-dragging'
                        )}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <span className="upload-skill-dropzone-icon flex items-center justify-center rounded-full">
                            <LumoIcon aria-hidden name="FileUp" size={22} />
                        </span>
                        <div className="flex flex-column items-center gap-1">
                            <span className="text-semibold color-norm">
                                {c('collider_2025:Info').t`Drop skill files or folders here`}
                            </span>
                            <span className="text-sm color-weak">
                                {c('collider_2025:Info')
                                    .t`.md, .zip, .skill or .plugin files, or folders. You can add several at once.`}
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button size="small" shape="outline" onClick={() => inputRef.current?.click()}>
                                {c('collider_2025:Action').t`Choose files`}
                            </Button>
                            <Button size="small" shape="outline" onClick={() => folderInputRef.current?.click()}>
                                {c('collider_2025:Action').t`Choose a folder`}
                            </Button>
                        </div>
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

                    <Collapsible>
                        <CollapsibleHeader
                            className="text-sm color-weak"
                            disableFullWidth
                            suffix={
                                <CollapsibleHeaderIconButton
                                    size="small"
                                    aria-label={c('collider_2025:Action').t`Show file requirements`}
                                >
                                    <LumoIcon name="ChevronDown" size={14} />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            {c('collider_2025:Label').t`What can I upload?`}
                        </CollapsibleHeader>
                        <CollapsibleContent>
                            <ul className="m-0 mt-1 pl-5 text-sm color-weak">
                                <li>
                                    {c('collider_2025:Info')
                                        .t`A .md file needs a name and description in its YAML frontmatter.`}
                                </li>
                                <li>{c('collider_2025:Info').t`A .zip or .skill file needs a SKILL.md file.`}</li>
                                <li>
                                    {c('collider_2025:Info')
                                        .t`Folders and plugins can hold several skills, each in its own folder with a SKILL.md.`}
                                </li>
                                <li>
                                    {c('collider_2025:Info')
                                        .t`${LUMO_SHORT_APP_NAME} can read the scripts in a skill but won't run them.`}
                                </li>
                            </ul>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {results.length > 0 && (
                    <ul className="unstyled m-0 flex flex-column gap-2">
                        {results.map((result) => (
                            <Card as="li" key={result.fileName} rounded background={false} className="bg-norm">
                                <div className="flex flex-nowrap items-start gap-3">
                                    <LumoIcon
                                        aria-hidden
                                        name={result.error ? 'CircleExclamationPoint' : 'Puzzle'}
                                        size={18}
                                        className={clsx(
                                            'shrink-0 mt-0.5',
                                            result.error ? 'color-danger' : 'color-weak'
                                        )}
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
                                            setImports((prev) => prev.filter((r) => r.fileName !== result.fileName))
                                        }
                                    >
                                        <LumoIcon name="X" size={14} />
                                    </Button>
                                </div>
                                {result.report && <ResultDetails report={result.report} />}
                            </Card>
                        ))}
                    </ul>
                )}

                <Card rounded className="flex flex-nowrap items-start gap-3">
                    <LumoIcon
                        aria-hidden
                        name={findingCount ? 'ShieldExclamationPoint' : 'ShieldCheck'}
                        size={18}
                        className={clsx('shrink-0 mt-0.5', findingCount ? 'color-warning' : 'color-weak')}
                    />
                    <div className="flex flex-column gap-1 flex-1 min-w-0">
                        <div className="flex flex-nowrap items-center justify-space-between gap-4">
                            <span className="text-semibold">{c('collider_2025:Label').t`Basic content check`}</span>
                            <span className="text-sm color-weak" aria-live="polite">
                                {checkStatus}
                            </span>
                        </div>
                        <p className="m-0 text-sm color-weak">
                            {c('collider_2025:Info')
                                .t`Looks for common problems such as hidden text, instructions that try to override ${LUMO_SHORT_APP_NAME}, keys left in files and risky commands. It's an automatic, basic check and can't catch everything, so only add skills from sources you trust.`}
                        </p>
                    </div>
                </Card>

                <div className="flex flex-wrap items-center justify-space-between gap-3">
                    <span className="text-sm color-weak">{footerHint}</span>
                    <div className="flex flex-nowrap gap-2 ml-auto">
                        <Button onClick={() => history.push('/customize')}>
                            {c('collider_2025:Action').t`Cancel`}
                        </Button>
                        <Button
                            color="norm"
                            disabled={valid.length === 0 || parsing || status !== 'ready'}
                            loading={uploading}
                            onClick={handleUpload}
                        >
                            {getAddLabel(valid)}
                        </Button>
                    </div>
                </div>
            </CustomizePage>
        </LumoLayoutWithDrawer>
    );
};
