import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';

import { clsx } from 'clsx';
import { format } from 'date-fns';
import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import {
    getDesktopConnectorCatalog,
    isDesktopEnvironment,
    useDesktopManifests,
} from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../components/ProjectIcon/ProjectIcon';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { triggerFileDownload } from '../../util/triggerFileDownload';
import { DEFAULT_AGENT_ICON } from '../agents/constants';
import { DeleteSkillPrompt } from '../skills/components/DeleteSkillPrompt';
import { SkillCodeView, type SkillCodeViewMode } from '../skills/components/SkillCodeView';
import { SkillEditorModal } from '../skills/components/SkillEditorModal';
import { SkillFileTree } from '../skills/components/SkillFileTree';
import {
    type WorkspaceFile,
    buildSkillArchive,
    sortWorkspaceFiles,
    toWorkspaceFile,
} from '../skills/components/skillWorkspace';
import { matchSkillConnectors } from '../skills/connectorMatching';
import { README_PATH, getSubSkillMarkdownPath, hasRootSkillMarkdown, isSkillPlugin } from '../skills/skillBundle';
import { findSharedHandles } from '../skills/skillInvocation';
import { getSkillHandle } from '../skills/skillMarkdown';
import { deleteSkill, loadSkillFiles, setSkillEnabled, setSubSkillEnabled } from '../skills/skillsThunks';
import { SKILL_MARKDOWN_PATH, type Skill, type SkillFileDraft } from '../skills/types';
import { selectSkillById, useSkills } from '../skills/useSkills';
import { CustomizePage } from './components/CustomizePage';
import { SkillConnectorsAside, SkillConnectorsTab } from './components/SkillConnectors';
import { SkillListRow } from './components/SkillListRow';
import { SKILL_FILE_PARAM } from './skillRoutes';
import { getSkillSourceLabel } from './skillSourceLabel';

import './SkillDetailView.scss';

type DetailTab = 'overview' | 'contents' | 'skills' | 'connectors';

const getMetaLine = (skill: Skill, fileCount: number) => {
    const updated = format(new Date(skill.updatedAt), 'PP', { locale: dateLocale });
    const subSkillCount = skill.subSkills?.length ?? 0;
    const author = skill.plugin?.author;
    const version = skill.plugin?.version;
    return [
        author ? c('collider_2025:Info').t`by ${author}` : getSkillSourceLabel(skill.source),
        version && `v${version}`,
        subSkillCount > 0
            ? c('collider_2025:Label').ngettext(msgid`${subSkillCount} skill`, `${subSkillCount} skills`, subSkillCount)
            : c('collider_2025:Label').ngettext(msgid`${fileCount} file`, `${fileCount} files`, fileCount),
        c('collider_2025:Info').t`updated ${updated}`,
    ]
        .filter(Boolean)
        .join(' · ');
};

export const SkillDetailView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const { status } = useSkills();
    const { skillId } = useParams<{ skillId: string }>();
    const skill = useLumoSelector(selectSkillById(skillId));
    const dispatch = useLumoDispatch();
    const history = useHistory();
    const { createNotification } = useNotifications();
    const editorModal = useModalStateObject();
    const deletePrompt = useModalStateObject();

    const [tab, setTab] = useState<DetailTab>('overview');
    const [files, setFiles] = useState<SkillFileDraft[] | undefined>();
    const [activePath, setActivePath] = useState<string>();
    const [mode, setMode] = useState<SkillCodeViewMode>('preview');
    const { search } = useLocation();

    useEffect(() => {
        const file = new URLSearchParams(search).get(SKILL_FILE_PARAM);
        if (file) {
            setActivePath(file);
            setMode('preview');
            setTab('contents');
        }
    }, [search]);

    useEffect(() => {
        if (!skill) return;
        let cancelled = false;
        void dispatch(loadSkillFiles(skill.id))
            .then((loaded) => !cancelled && setFiles(loaded))
            .catch(() => !cancelled && setFiles([]));
        return () => {
            cancelled = true;
        };
    }, [skill?.id, skill?.updatedAt]);

    const workspaceFiles = useMemo((): WorkspaceFile[] => {
        if (!skill) return [];
        const root: WorkspaceFile[] = hasRootSkillMarkdown(skill)
            ? [{ path: SKILL_MARKDOWN_PATH, mimeType: 'text/markdown', text: skill.instructions }]
            : [];
        return sortWorkspaceFiles([...root, ...(files ?? []).map(toWorkspaceFile)]);
    }, [skill, files]);

    const allSkills = useLumoSelector((state) => state.skills.skills);
    const sharedHandles = useMemo(
        () => (skill ? findSharedHandles(Object.values(allSkills), skill.id) : []),
        [allSkills, skill]
    );

    const isDesktop = isDesktopEnvironment();
    const { manifests } = useDesktopManifests();
    const connectorMatches = useMemo(
        () =>
            matchSkillConnectors(
                { connectors: skill?.connectors, connectorCategories: skill?.connectorCategories },
                { manifests, catalog: getDesktopConnectorCatalog() }
            ),
        [skill?.connectors, skill?.connectorCategories, manifests]
    );

    if (status !== 'ready') {
        return (
            <LumoLayoutWithDrawer drawer={{ disabled: true }}>
                <div className="p-8 color-weak">
                    {status === 'error'
                        ? c('collider_2025:Error').t`Could not load your skills.`
                        : c('collider_2025:Info').t`Loading…`}
                </div>
            </LumoLayoutWithDrawer>
        );
    }

    if (!skill) {
        return (
            <LumoLayoutWithDrawer drawer={{ disabled: true }}>
                <CustomizePage className="gap-4">
                    <p className="m-0">{c('collider_2025:Info').t`This skill no longer exists.`}</p>
                    <Link to="/customize">{c('collider_2025:Link').t`Back to skills`}</Link>
                </CustomizePage>
            </LumoLayoutWithDrawer>
        );
    }

    const isPlugin = isSkillPlugin(skill);
    const subSkills = skill.subSkills ?? [];
    const connectorCount = connectorMatches.categories.length + connectorMatches.servers.length;
    const readme = workspaceFiles.find((file) => file.path === README_PATH && file.text !== undefined);
    const activeFile = workspaceFiles.find((file) => file.path === activePath) ?? readme ?? workspaceFiles[0];
    const filePaths = workspaceFiles.map((file) => file.path);
    const sharedHandleList = sharedHandles.map((handle) => `/${handle}`).join(', ');

    const tabs: [DetailTab, string][] = [
        ['overview', c('collider_2025:Tab').t`Overview`],
        ['contents', c('collider_2025:Tab').t`Contents`],
    ];
    if (subSkills.length) {
        tabs.push(['skills', `${c('collider_2025:Tab').t`Skills`} · ${subSkills.length}`]);
    }
    if (connectorCount) {
        tabs.push(['connectors', `${c('collider_2025:Tab').t`Connectors`} · ${connectorCount}`]);
    }

    const openFile = (path: string) => {
        setActivePath(path);
        setMode('preview');
        setTab('contents');
    };

    const handleDownload = async () => {
        try {
            const archive = await buildSkillArchive(skill, files ?? []);
            await triggerFileDownload(archive, `${getSkillHandle(skill.name) || 'skill'}.zip`);
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not download the skill` });
        }
    };

    const handleDelete = async () => {
        await dispatch(deleteSkill(skill.id));
        history.push('/customize');
    };

    const renderOverview = () => (
        <div className="skill-detail__overview">
            <div className="flex flex-column flex-nowrap gap-6 min-w-0">
                {sharedHandles.length > 0 && (
                    <p className="m-0 text-sm color-warning flex flex-nowrap items-start gap-2">
                        <LumoIcon aria-hidden name="TriangleAlert" size={16} className="shrink-0 mt-0.5" />
                        <span>
                            {c('collider_2025:Info')
                                .t`Another skill is also invoked with ${sharedHandleList}, so only one of them can be used. Rename one of them.`}
                        </span>
                    </p>
                )}
                <section className="flex flex-column flex-nowrap gap-2">
                    <h2 className="text-sm color-weak text-normal m-0">{c('collider_2025:Title').t`Description`}</h2>
                    <p className="m-0">{skill.description || '—'}</p>
                </section>
                {!isPlugin && (
                    <section className="flex flex-column flex-nowrap gap-2">
                        <h2 className="text-sm color-weak text-normal m-0">{c('collider_2025:Title')
                            .t`Invoke with`}</h2>
                        <code className="skill-detail__handle w-fit-content">/{getSkillHandle(skill.name)}</code>
                    </section>
                )}
                {skill.metadata && Object.keys(skill.metadata).length > 0 && (
                    <section className="flex flex-column flex-nowrap gap-2">
                        <h2 className="text-sm color-weak text-normal m-0">{c('collider_2025:Title').t`Details`}</h2>
                        <dl className="skill-detail__metadata m-0">
                            {Object.entries(skill.metadata).map(([key, value]) => (
                                <div key={key} className="flex flex-nowrap gap-4">
                                    <dt className="color-weak">{key}</dt>
                                    <dd className="m-0 text-break">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}
                {readme && (
                    <section className="skill-detail__readme">
                        <SkillCodeView file={readme} mode="preview" filePaths={filePaths} onOpenFile={openFile} />
                    </section>
                )}
            </div>
            <aside className="skill-detail__aside flex flex-column gap-3">
                <label
                    className="flex flex-nowrap items-center justify-space-between gap-3"
                    htmlFor="skill-detail-enabled"
                >
                    <span>{c('collider_2025:Label').t`Enabled`}</span>
                    <Toggle
                        id="skill-detail-enabled"
                        checked={skill.enabled}
                        onChange={() => dispatch(setSkillEnabled({ id: skill.id, enabled: !skill.enabled }))}
                    />
                </label>
                <p className="m-0 text-sm color-weak">
                    {isPlugin
                        ? c('collider_2025:Info')
                              .t`Turning off the plugin turns off all of its skills. ${LUMO_SHORT_APP_NAME} won't use them, but they stay saved.`
                        : c('collider_2025:Info')
                              .t`Turned-off skills stay saved but ${LUMO_SHORT_APP_NAME} won't use them.`}
                </p>
                <SkillConnectorsAside
                    matches={connectorMatches}
                    isDesktop={isDesktop}
                    onViewAll={() => setTab('connectors')}
                />
            </aside>
        </div>
    );

    const renderContents = () =>
        activeFile ? (
            <div className="skill-detail__contents flex flex-nowrap">
                <SkillFileTree files={workspaceFiles} activePath={activeFile.path} onSelect={setActivePath} />
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    <div className="skill-detail__file-header flex flex-nowrap items-center gap-3">
                        <nav
                            className="skill-detail__breadcrumb flex flex-nowrap items-center gap-1 flex-1 min-w-0"
                            aria-label={c('collider_2025:Label').t`File path`}
                        >
                            {activeFile.path.split('/').map((segment, index, segments) => (
                                <Fragment key={segments.slice(0, index + 1).join('/')}>
                                    {index > 0 && (
                                        <LumoIcon
                                            aria-hidden
                                            name="ChevronRight"
                                            size={12}
                                            className="shrink-0 color-hint"
                                        />
                                    )}
                                    <span
                                        className={clsx(
                                            'text-ellipsis',
                                            index === segments.length - 1 ? 'is-current shrink-0' : 'color-weak'
                                        )}
                                        aria-current={index === segments.length - 1 ? 'page' : undefined}
                                    >
                                        {segment}
                                    </span>
                                </Fragment>
                            ))}
                        </nav>
                        {/\.(md|markdown)$/i.test(activeFile.path) && (
                            <div className="skill-detail__mode-toggle flex flex-nowrap shrink-0" role="group">
                                {(
                                    [
                                        ['preview', 'Eye', c('collider_2025:Action').t`Preview`],
                                        ['code', 'CodeXml', c('collider_2025:Action').t`Code`],
                                    ] as const
                                ).map(([value, icon, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={clsx(
                                            'skill-detail__mode-button flex flex-nowrap items-center gap-1.5',
                                            mode === value && 'is-active'
                                        )}
                                        aria-pressed={mode === value}
                                        onClick={() => setMode(value)}
                                    >
                                        <LumoIcon aria-hidden name={icon} size={14} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        <SkillCodeView
                            key={activeFile.path}
                            file={activeFile}
                            mode={mode}
                            filePaths={filePaths}
                            onOpenFile={openFile}
                        />
                    </div>
                </div>
            </div>
        ) : (
            <p className="m-0 color-weak">{c('collider_2025:Info').t`Loading…`}</p>
        );

    const renderSkills = () => (
        <ul className="m-0 p-0 list-none">
            {subSkills.map((subSkill) => (
                <SkillListRow
                    key={subSkill.path}
                    icon={<LumoIcon name="ScrollText" size={16} />}
                    name={`/${getSkillHandle(subSkill.name) || subSkill.name}`}
                    description={subSkill.description}
                    enabled={subSkill.enabled}
                    locked={!skill.enabled}
                    onOpen={() => openFile(getSubSkillMarkdownPath(subSkill))}
                    onEnabledChange={(enabled) =>
                        dispatch(setSubSkillEnabled({ id: skill.id, path: subSkill.path, enabled }))
                    }
                />
            ))}
        </ul>
    );

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <CustomizePage className="gap-5" fill={tab === 'contents'}>
                <Link to="/customize" className="flex items-center gap-2 color-norm text-no-decoration w-fit-content">
                    <LumoIcon name="ArrowLeft" size={16} className="rtl:mirror" />
                    {c('collider_2025:Link').t`Skills`}
                </Link>

                <header className="flex flex-nowrap items-center gap-4">
                    <div className="skill-detail__icon flex shrink-0 items-center justify-center">
                        {isPlugin ? (
                            <LumoIcon name="Package" size={20} />
                        ) : (
                            <ProjectIcon iconId={skill.icon ?? DEFAULT_AGENT_ICON} size={20} />
                        )}
                    </div>
                    <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                        <h1 className="text-lg text-semibold m-0 text-ellipsis">{skill.name}</h1>
                        <span className="text-sm color-weak text-ellipsis">
                            {getMetaLine(skill, workspaceFiles.length)}
                        </span>
                    </div>
                    <Button
                        icon
                        shape="ghost"
                        className="shrink-0"
                        aria-label={c('collider_2025:Action').t`Download`}
                        title={c('collider_2025:Action').t`Download`}
                        onClick={handleDownload}
                        disabled={files === undefined}
                    >
                        <LumoIcon name="Download" size={16} />
                    </Button>
                    <Button
                        icon
                        shape="ghost"
                        className="shrink-0"
                        aria-label={c('collider_2025:Action').t`Delete`}
                        title={c('collider_2025:Action').t`Delete`}
                        onClick={() => deletePrompt.openModal(true)}
                    >
                        <LumoIcon name="Trash" size={16} />
                    </Button>
                    <Button className="shrink-0" onClick={() => editorModal.openModal(true)}>
                        {c('collider_2025:Action').t`Edit`}
                    </Button>
                </header>

                <div className="skill-detail__tabs flex flex-nowrap gap-6" role="tablist">
                    {tabs.map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={tab === id}
                            className={clsx('skill-detail__tab border-none bg-transparent', tab === id && 'is-active')}
                            onClick={() => setTab(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && renderOverview()}
                {tab === 'contents' && renderContents()}
                {tab === 'skills' && renderSkills()}
                {tab === 'connectors' && <SkillConnectorsTab matches={connectorMatches} isDesktop={isDesktop} />}
            </CustomizePage>
            {editorModal.render && <SkillEditorModal {...editorModal.modalProps} skillId={skill.id} />}
            {deletePrompt.render && (
                <DeleteSkillPrompt {...deletePrompt.modalProps} skillName={skill.name} onConfirm={handleDelete} />
            )}
        </LumoLayoutWithDrawer>
    );
};
