import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { Button } from '@proton/atoms/Button/Button';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import GenericError from '@proton/components/containers/error/GenericError';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { SignInButton } from '../../components/Guest/SignInLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import config from '../../config';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useIsGuest } from '../../providers/IsGuestProvider';
import {
    useDebugApiAccessDenied,
    useDebugApiOrganizationMemberView,
    useDebugApiOrganizationView,
} from '../../services/apiUsageDebugStore';
import ApiKeysPanel from '../api-keys/ApiKeysPanel';
import { ApiUsagePanel } from '../api-keys/ApiUsagePanel';
import { ApiBaseUrlBar } from './ApiBaseUrlBar';
import { ApiDocsCodeBlock } from './ApiDocsCodeBlock';
import { ApiModelsCatalogSection } from './ApiModelsCatalogSection';
import { ApiPricingSummary } from './ApiPricingSummary';
import { markApiDocsVisited } from './apiDocsVisit';
import { type ApiModel, fetchApiModels } from './apiModels';
import { type ChatExampleVariant, type CodeLang, type HttpMethod, LUMO_API_DOCS_SPEC } from './lumoApiDocs.config';
import { WorkflowCodegenPanel } from './workflow-builder';

import './ApiDocsPage.scss';

const METHOD_STYLE: Record<HttpMethod, { color: string; bg: string }> = {
    GET: { color: '#1d8a4e', bg: '#1d8a4e18' },
    POST: { color: '#7c3aed', bg: '#7c3aed18' },
    PUT: { color: '#7c3aed', bg: '#7c3aed18' },
    PATCH: { color: '#7c3aed', bg: '#7c3aed18' },
    DELETE: { color: '#dc2626', bg: '#dc262618' },
};

const CHAT_EXAMPLE_LABELS: Record<ChatExampleVariant, () => string> = {
    basic: () => c('collider_2025: Label').t`Basic`,
    tool_call: () => c('collider_2025: Label').t`Tool calls`,
};

const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const MethodBadge = ({ method }: { method: HttpMethod }) => {
    const s = METHOD_STYLE[method];
    return (
        <span
            className="px-1 py-0.5 radius-4 lumo-font-mono lumo-body-medium"
            style={{ color: s.color, background: s.bg }}
        >
            {method}
        </span>
    );
};

type DocsTab = 'api' | 'usage' | 'keys' | 'workflow';
type ApiModelsState =
    | { status: 'loading'; models: ApiModel[] }
    | { status: 'success'; models: ApiModel[] }
    | { status: 'error'; models: ApiModel[] };

// Same origin until CSP allows the public API host.
const API_DOCS_MODELS_BASE_URL = `${config.API_URL}/ai/v1`;

const StatusBadge = ({ status }: { status: 'ga' | 'beta' }) =>
    status === 'ga' ? (
        <span className="uppercase px-1.5 py-0.5 radius-4 lumo-label-small lumo-color-glyph bg-success">
            {c('collider_2025: Badge').t`GA`}
        </span>
    ) : (
        <span className="uppercase px-1.5 py-0.5 radius-4 lumo-label-small lumo-color-glyph bg-warning">
            {c('collider_2025: Badge').t`Beta`}
        </span>
    );

const ApiAccessDeniedNotice = () => (
    <div className="flex flex-column items-start gap-2 p-6 border radius-12 lumo-bg-control-fill">
        <strong>{c('collider_2025: Title').t`API access is not enabled`}</strong>
        <p className="m-0 lumo-color-glyph-mid">
            {c('collider_2025: Info')
                .t`Your organization has not allowed API access for your account. Contact your organization administrator to request access.`}
        </p>
    </div>
);

const ApiNotIncludedNotice = () => (
    <div className="p-6 border radius-12 lumo-bg-control-fill">
        <p className="m-0 lumo-color-glyph-mid">{c('collider_2025: Info').t`Your plan doesn't include API access.`}</p>
    </div>
);

const AskForSeatNotice = () => (
    <div className="p-6 border radius-12 lumo-bg-control-fill">
        <p className="m-0 lumo-color-glyph-mid">
            {c('collider_2025: Info')
                .t`Ask your organization administrator to assign a ${LUMO_SHORT_APP_NAME} seat to your account to use the API.`}
        </p>
    </div>
);

interface ApiDocsPageContentProps {
    hasLumoApi: boolean;
    isEntitlementsLoading: boolean;
}

const ApiDocsPageContent = ({ hasLumoApi, isEntitlementsLoading }: ApiDocsPageContentProps) => {
    const history = useHistory();
    const location = useLocation();
    const { apiKeyManagement } = useLumoFlags();
    const isGuest = useIsGuest();
    const { hasLumoPlus, isLumoPlanLoading, canShowTalkToAdminLumoUpsell, isOrgAdmin, userIsMember } = useLumoPlan();
    const debugOrganizationView = useDebugApiOrganizationView();
    const debugOrganizationMemberView = useDebugApiOrganizationMemberView();
    const isAccessLoading = isLumoPlanLoading || isEntitlementsLoading;
    const spec = LUMO_API_DOCS_SPEC;

    const effectiveOrgAdmin = isOrgAdmin || debugOrganizationView;
    const isOrgMember = debugOrganizationMemberView || (!effectiveOrgAdmin && userIsMember);
    const debugApiAccessDenied = useDebugApiAccessDenied();
    const apiAccessDenied = isOrgMember && debugApiAccessDenied;
    const hasApiAccess = hasLumoApi && (hasLumoPlus || isOrgAdmin);
    const canManageApiKeys = !isGuest && apiKeyManagement && hasApiAccess && !apiAccessDenied;
    /** Organization preview only reveals mocked UI and does not grant backend permissions. */
    const canViewApiUsage =
        !apiAccessDenied &&
        !isGuest &&
        apiKeyManagement &&
        (hasApiAccess || debugOrganizationView || debugOrganizationMemberView);

    const [docsTab, setDocsTab] = useState<DocsTab>('api');
    const [activeNav, setActiveNav] = useState('overview');
    const [chatExample, setChatExample] = useState<ChatExampleVariant>('basic');
    const [apiModelsState, setApiModelsState] = useState<ApiModelsState>({ status: 'loading', models: [] });
    const [apiModelsReload, setApiModelsReload] = useState(0);

    useEffect(() => {
        const abortController = new AbortController();
        setApiModelsState((current) => ({ status: 'loading', models: current.models }));

        void fetchApiModels(API_DOCS_MODELS_BASE_URL, abortController.signal)
            .then((models) => setApiModelsState({ status: 'success', models }))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                setApiModelsState((current) => ({ status: 'error', models: current.models }));
            });

        return () => abortController.abort();
    }, [apiModelsReload]);

    const flatEndpoints = useMemo(
        () => spec.endpointGroups.flatMap((g) => g.endpoints.map((ep) => ({ groupId: g.id, ...ep }))),
        [spec.endpointGroups]
    );

    const handleNav = useCallback((id: string) => {
        setActiveNav(id);
        scrollToAnchor(id);
    }, []);

    const selectDocsTab = useCallback(
        (tab: DocsTab) => {
            setDocsTab(tab);
            if (tab === 'usage') {
                history.replace({ pathname: location.pathname, search: location.search, hash: '#api-usage' });
            } else if (tab === 'keys') {
                history.replace({ pathname: location.pathname, search: location.search, hash: '#api-keys' });
            } else if (tab === 'workflow') {
                history.replace({ pathname: location.pathname, search: location.search, hash: '#workflow' });
            } else {
                history.replace({ pathname: location.pathname, search: location.search, hash: '' });
            }
        },
        [history, location.pathname, location.search]
    );

    useEffect(() => {
        const hash = location.hash.replace(/^#/, '');
        if (hash !== 'api-usage' && hash !== 'api-keys' && hash !== 'workflow') {
            markApiDocsVisited();
        }
        if (hash === 'api-usage') {
            setDocsTab('usage');
        } else if (hash === 'api-keys') {
            setDocsTab('keys');
        } else if (hash === 'workflow') {
            setDocsTab('workflow');
        } else {
            setDocsTab('api');
            if (hash) {
                setActiveNav(hash);
                requestAnimationFrame(() => scrollToAnchor(hash));
            }
        }
    }, [location.hash]);

    const groupTitle = (groupId: string) => {
        switch (groupId) {
            case 'chat':
                return c('collider_2025: Title').t`Chat`;
            case 'models':
                return c('collider_2025: Title').t`Models`;
            default:
                return groupId;
        }
    };

    useNativeComposerVisibilityApi({ hideComposer: true });

    const docsTabsHeader = (
        <div className="api-docs-page-tabs-row flex flex-row justify-center w-full">
            <div
                className="api-docs-page-tabs gap-1 p-1 flex flex-wrap border radius-12 lumo-bg-control-fill"
                role="tablist"
                aria-label={c('collider_2025: Title').t`API docs sections`}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'usage'}
                    className={clsx(
                        'api-docs-page-tab px-4 radius-8 lumo-label-large lumo-color-glyph-mid',
                        docsTab === 'usage' && 'is-active'
                    )}
                    onClick={() => selectDocsTab('usage')}
                >
                    {c('collider_2025: Tab').t`Overview`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'api'}
                    className={clsx(
                        'api-docs-page-tab px-4 radius-8 lumo-label-large lumo-color-glyph-mid',
                        docsTab === 'api' && 'is-active'
                    )}
                    onClick={() => selectDocsTab('api')}
                >
                    {c('collider_2025: Tab').t`Docs`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'keys'}
                    className={clsx(
                        'api-docs-page-tab px-4 radius-8 lumo-label-large lumo-color-glyph-mid',
                        docsTab === 'keys' && 'is-active'
                    )}
                    onClick={() => selectDocsTab('keys')}
                >
                    {c('collider_2025: Tab').t`API keys`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'workflow'}
                    className={clsx(
                        'api-docs-page-tab px-4 radius-8 lumo-label-large lumo-color-glyph-mid',
                        docsTab === 'workflow' && 'is-active'
                    )}
                    onClick={() => selectDocsTab('workflow')}
                >
                    {c('collider_2025: Tab').t`Workflow Builder`}
                </button>
            </div>
        </div>
    );

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }} header={{ component: docsTabsHeader }}>
            <div className="api-docs-page flex flex-1 flex-column min-h-0">
                <div className="api-docs-page-body flex flex-1 min-h-0 overflow-y-auto flex-column items-center w-full">
                    {docsTab === 'api' && (
                        <div className="api-docs-page-body-panel py-6 px-5 w-full min-w-0">
                            <div className="api-docs-page-layout gap-6">
                                <nav
                                    className="api-docs-page-nav pt-0 pb-4 pl-0 pr-2"
                                    aria-label={c('collider_2025: Title').t`API documentation`}
                                >
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link px-3 block w-full radius-8 text-left lumo-label-large lumo-color-glyph',
                                            activeNav === 'overview' && 'is-active'
                                        )}
                                        onClick={() => handleNav('overview')}
                                    >
                                        {c('collider_2025: Nav').t`Overview`}
                                    </button>
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link px-3 block w-full radius-8 text-left lumo-label-large lumo-color-glyph',
                                            activeNav === 'authentication' && 'is-active'
                                        )}
                                        onClick={() => handleNav('authentication')}
                                    >
                                        {c('collider_2025: Nav').t`Authentication`}
                                    </button>
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link px-3 block w-full radius-8 text-left lumo-label-large lumo-color-glyph',
                                            activeNav === 'models' && 'is-active'
                                        )}
                                        onClick={() => handleNav('models')}
                                    >
                                        {c('collider_2025: Nav').t`Models & pricing`}
                                    </button>
                                    <div className="api-docs-page-nav-group-label pt-2 pb-1 px-3 mt-2 lumo-label-small lumo-color-glyph-mid">{c(
                                        'collider_2025: Nav'
                                    ).t`Endpoints`}</div>
                                    {spec.endpointGroups.map((group) => (
                                        <div key={group.id}>
                                            <div className="api-docs-page-nav-group-label pt-2 pb-1 px-3 mt-2 lumo-label-small lumo-color-glyph-mid">
                                                {groupTitle(group.id)}
                                            </div>
                                            {group.endpoints.map((ep) => (
                                                <button
                                                    key={ep.id}
                                                    type="button"
                                                    className={clsx(
                                                        'api-docs-page-nav-endpoint pl-4 pr-3 flex items-center gap-1.5 w-full radius-8 text-left lumo-label-medium lumo-color-glyph-mid',
                                                        activeNav === ep.id && 'is-active'
                                                    )}
                                                    onClick={() => handleNav(ep.id)}
                                                >
                                                    <MethodBadge method={ep.method} />
                                                    <span className="lumo-font-mono">{ep.path}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </nav>

                                <div className="api-docs-page-main-wrap flex justify-center">
                                    <main className="api-docs-page-main pt-0 pb-8 w-full min-w-0">
                                        <section id="overview" className="api-docs-page-section-anchor mb-14">
                                            <div className="api-docs-page-hero mb-10 border radius-16">
                                                <div className="api-docs-page-hero-eyebrow py-1 mb-4 radius-full lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                                    {c('collider_2025: Title')
                                                        .t`${LUMO_SHORT_APP_NAME} API · ${spec.versionLabel}`}
                                                </div>
                                                <h1 className="api-docs-page-hero-title mt-0 mb-4 mx-0 lumo-color-glyph">
                                                    {c('collider_2025: Title').t`Build intelligent apps.`}
                                                    <br />
                                                    <span className="api-docs-page-hero-title-accent lumo-color-glyph-brand-text">
                                                        {c('collider_2025: Title').t`Privacy included by default.`}
                                                    </span>
                                                </h1>
                                                <p className="api-docs-page-hero-text mt-0 mb-6 mx-0 lumo-body-large lumo-color-glyph-mid">
                                                    {c('collider_2025: Info')
                                                        .t`The ${LUMO_SHORT_APP_NAME} API gives you programmatic access to language models with ${BRAND_NAME}'s privacy architecture built in. No data training on your requests. No tracking.`}
                                                </p>
                                                <ApiBaseUrlBar url={spec.apiBaseUrl} />
                                            </div>

                                            <section aria-labelledby="api-getting-started-title" className="mb-10">
                                                <h2
                                                    id="api-getting-started-title"
                                                    className="mt-0 mb-2 lumo-title-large"
                                                >
                                                    {c('collider_2025: Title').t`Getting started`}
                                                </h2>
                                                <p
                                                    className="mt-0 mb-4 lumo-color-glyph-mid"
                                                    style={{ lineHeight: 1.7 }}
                                                >
                                                    {isOrgMember
                                                        ? c('collider_2025: Info')
                                                              .t`Check your organization access and create credentials before making your first API request.`
                                                        : c('collider_2025: Info')
                                                              .t`Set up billing and authentication before making your first API request.`}
                                                </p>
                                                <div className="api-docs-page-getting-started-grid border radius-12 lumo-bg-panel">
                                                    <article className="api-docs-page-getting-started-step p-5 flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center mb-3 radius-full lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                                            1
                                                        </span>
                                                        <h3 className="m-0 mb-1 lumo-title-medium">
                                                            {isOrgMember
                                                                ? c('collider_2025: Title').t`Check organization access`
                                                                : c('collider_2025: Title').t`Top up balance`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none m-0 mb-4 lumo-body-small lumo-color-glyph-mid">
                                                            {isOrgMember
                                                                ? c('collider_2025: Info')
                                                                      .t`Your administrator manages the shared API balance for your organization.`
                                                                : c('collider_2025: Info')
                                                                      .t`Top up your API balance so requests can run without interruption.`}
                                                        </p>
                                                        <Button
                                                            size="small"
                                                            color="weak"
                                                            shape="ghost"
                                                            className="self-start mt-auto"
                                                            onClick={() => selectDocsTab('usage')}
                                                        >
                                                            {isOrgMember
                                                                ? c('collider_2025: Action').t`View my usage`
                                                                : c('collider_2025: Action').t`Manage balance`}
                                                        </Button>
                                                    </article>

                                                    <article className="api-docs-page-getting-started-step p-5 flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center mb-3 radius-full lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                                            2
                                                        </span>
                                                        <h3 className="m-0 mb-1 lumo-title-medium">
                                                            {c('collider_2025: Title').t`Generate an API key`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none m-0 mb-4 lumo-body-small lumo-color-glyph-mid">
                                                            {c('collider_2025: Info')
                                                                .t`Create a key and store it securely. It is only shown once.`}
                                                        </p>
                                                        <Button
                                                            size="small"
                                                            color="weak"
                                                            shape="ghost"
                                                            className="self-start mt-auto"
                                                            onClick={() => selectDocsTab('keys')}
                                                        >
                                                            {c('collider_2025: Action').t`Manage API keys`}
                                                        </Button>
                                                    </article>

                                                    <article className="api-docs-page-getting-started-step p-5 flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center mb-3 radius-full lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                                            3
                                                        </span>
                                                        <h3 className="m-0 mb-1 lumo-title-medium">
                                                            {c('collider_2025: Title').t`Make your first request`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none m-0 mb-4 lumo-body-small lumo-color-glyph-mid">
                                                            {c('collider_2025: Info')
                                                                .t`Add your key to the authorization header and call a model.`}
                                                        </p>
                                                        <Button
                                                            size="small"
                                                            color="weak"
                                                            shape="ghost"
                                                            className="self-start mt-auto"
                                                            onClick={() => handleNav('authentication')}
                                                        >
                                                            {c('collider_2025: Action').t`View authentication`}
                                                        </Button>
                                                    </article>
                                                </div>
                                            </section>

                                            <ApiPricingSummary
                                                models={apiModelsState.models}
                                                onViewModels={() => handleNav('models')}
                                            />

                                            <h2 className="mt-0 mb-2 lumo-title-large">{c('collider_2025: Title')
                                                .t`What you can build`}</h2>
                                            <p
                                                className="mb-4 lumo-color-glyph-mid"
                                                style={{ lineHeight: 1.7, maxWidth: '40rem' }}
                                            >
                                                {c('collider_2025: Info')
                                                    .t`The ${LUMO_SHORT_APP_NAME} API is a RESTful interface that follows the OpenAI API schema — drop in your existing client with a one-line change.`}
                                            </p>

                                            <div className="api-docs-page-feature-grid gap-3 mb-8">
                                                <div className="api-docs-page-feature-card border lumo-bg-panel">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center mb-3 radius-12 lumo-color-glyph-brand-text lumo-bg-control-fill"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="Zap" size={18} />
                                                    </div>
                                                    <div className="lumo-title-small mb-1">{c('collider_2025: Title')
                                                        .t`Workflow automation`}</div>
                                                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">
                                                        {c('collider_2025: Info')
                                                            .t`Chain tool calls to orchestrate multi-step pipelines end-to-end.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-feature-card border lumo-bg-panel">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center mb-3 radius-12 lumo-color-glyph-brand-text lumo-bg-control-fill"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="PencilSparkles" size={18} />
                                                    </div>
                                                    <div className="lumo-title-small mb-1">{c('collider_2025: Title')
                                                        .t`Document intelligence`}</div>
                                                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">
                                                        {c('collider_2025: Info')
                                                            .t`Extract, analyze, and summarise documents, PDFs, and images.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-feature-card border lumo-bg-panel">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center mb-3 radius-12 lumo-color-glyph-brand-text lumo-bg-control-fill"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="MessagesSquare" size={18} />
                                                    </div>
                                                    <div className="lumo-title-small mb-1">{c('collider_2025: Title')
                                                        .t`Conversational AI`}</div>
                                                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">
                                                        {c('collider_2025: Info')
                                                            .t`Build privacy-first assistants with streaming and persistent context.`}
                                                    </p>
                                                </div>
                                            </div>

                                            <h3 className="mb-3 lumo-title-medium">{c('collider_2025: Title')
                                                .t`API endpoints overview`}</h3>
                                            <div className="api-docs-page-endpoint-table border">
                                                <div className="api-docs-page-endpoint-head border-bottom lumo-border lumo-label-small lumo-color-glyph-mid lumo-bg-control-fill">
                                                    <span>{c('collider_2025: Label').t`Method`}</span>
                                                    <span>{c('collider_2025: Label').t`Path`}</span>
                                                    <span>{c('collider_2025: Label').t`Description`}</span>
                                                    <span>{c('collider_2025: Label').t`Status`}</span>
                                                </div>
                                                {flatEndpoints.map((ep) => (
                                                    <button
                                                        key={ep.id}
                                                        type="button"
                                                        className="api-docs-page-endpoint-row lumo-body-small text-left"
                                                        onClick={() => handleNav(ep.id)}
                                                    >
                                                        <span>
                                                            <MethodBadge method={ep.method} />
                                                        </span>
                                                        <code className="lumo-body-small lumo-font-mono">
                                                            {ep.path}
                                                        </code>
                                                        <span className="lumo-body-small lumo-color-glyph-mid">
                                                            {ep.description}
                                                        </span>
                                                        <StatusBadge status={ep.status} />
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <div className="mb-10 border-top lumo-border" />

                                        <section id="authentication" className="api-docs-page-section-anchor mb-14">
                                            <h2 className="mt-0 mb-2 lumo-title-large">{c('collider_2025: Title')
                                                .t`Authentication`}</h2>
                                            <p className="mb-4 lumo-color-glyph-mid" style={{ lineHeight: 1.7 }}>
                                                {c('collider_2025: Info')
                                                    .t`All API requests must include your API key in the `}
                                                <code className="px-1 py-0.5 radius-4 lumo-font-mono lumo-bg-control-fill">
                                                    Authorization
                                                </code>
                                                {c('collider_2025: Info')
                                                    .t` header. Keys are scoped to your account and can be revoked from `}
                                                {!isGuest ? (
                                                    <button
                                                        type="button"
                                                        className="link align-baseline p-0"
                                                        onClick={() => selectDocsTab('keys')}
                                                    >
                                                        {c('collider_2025: Link').t`Manage keys`}
                                                    </button>
                                                ) : (
                                                    c('collider_2025: Info').t`Manage keys after you sign in`
                                                )}
                                                {'. '}
                                            </p>

                                            <h3 className="mb-2 lumo-title-medium">{c('collider_2025: Title')
                                                .t`Required headers`}</h3>
                                            <div className="api-docs-page-param-table mt-4 mb-4 border radius-8">
                                                <div className="api-docs-page-param-row gap-3 py-3 px-4">
                                                    <div>
                                                        <code className="lumo-font-mono lumo-body-medium">
                                                            Authorization
                                                        </code>
                                                        <div className="lumo-font-mono lumo-body-small lumo-color-glyph-mid">
                                                            string
                                                        </div>
                                                        <span className="lumo-label-small lumo-color-signal-danger">{c(
                                                            'collider_2025: Label'
                                                        ).t`required`}</span>
                                                    </div>
                                                    <p className="m-0 lumo-color-glyph-mid">
                                                        {c('collider_2025: Info')
                                                            .t`Authenticates the request. Never expose this in client-side code.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-param-row gap-3 py-3 px-4">
                                                    <div>
                                                        <code className="lumo-font-mono lumo-body-medium">
                                                            Content-Type
                                                        </code>
                                                        <div className="lumo-font-mono lumo-body-small lumo-color-glyph-mid">
                                                            application/json
                                                        </div>
                                                        <span className="lumo-label-small lumo-color-signal-danger">{c(
                                                            'collider_2025: Label'
                                                        ).t`required`}</span>
                                                    </div>
                                                    <p className="m-0 lumo-color-glyph-mid">
                                                        {c('collider_2025: Info')
                                                            .t`Required on all POST requests with a JSON body.`}
                                                    </p>
                                                </div>
                                            </div>

                                            <ApiDocsCodeBlock codeByLang={spec.authExamples} />

                                            <div className="mt-4 p-4 border radius-12 lumo-bg-panel-elevated">
                                                <strong>{c('collider_2025: Title').t`Security note:`}</strong>{' '}
                                                {c('collider_2025: Info')
                                                    .t`Never embed API keys in client-side bundles. Use environment variables and a server-side proxy in production.`}
                                            </div>
                                        </section>

                                        <div className="mb-10 border-top lumo-border" />

                                        <ApiModelsCatalogSection
                                            status={apiModelsState.status}
                                            models={apiModelsState.models}
                                            onRetry={() => setApiModelsReload((value) => value + 1)}
                                        />

                                        <div className="mb-10 border-top lumo-border" />

                                        {spec.endpointGroups.map((group) => (
                                            <div key={group.id}>
                                                <div className="flex items-center gap-3 mt-8 mb-5">
                                                    <h2 className="m-0 lumo-title-large">{groupTitle(group.id)}</h2>
                                                    <div className="api-docs-page-group-divider-line flex-1" />
                                                </div>
                                                {group.endpoints.map((ep) => (
                                                    <section
                                                        key={ep.id}
                                                        id={ep.id}
                                                        className="api-docs-page-section-anchor mb-12"
                                                    >
                                                        <div className="flex flex-row flex-wrap items-center gap-2 mb-2">
                                                            <MethodBadge method={ep.method} />
                                                            <code className="lumo-body-medium lumo-font-mono">
                                                                {ep.path}
                                                            </code>
                                                            <StatusBadge status={ep.status} />
                                                            {ep.openaiCompatible && (
                                                                <span className="px-1.5 py-0.5 radius-4 lumo-label-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                                                    {c('collider_2025: Badge').t`OpenAI-compatible`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p
                                                            className="mb-4 lumo-color-glyph-mid"
                                                            style={{ lineHeight: 1.7 }}
                                                        >
                                                            {ep.description}
                                                        </p>
                                                        {ep.parameters && ep.parameters.length > 0 && (
                                                            <div className="api-docs-page-param-table mt-4 border radius-8">
                                                                <div className="api-docs-page-param-head border-bottom lumo-border py-2 px-4 lumo-label-small lumo-color-glyph-mid lumo-bg-control-fill">{c(
                                                                    'collider_2025: Title'
                                                                ).t`Parameters`}</div>
                                                                {ep.parameters.map((p) => (
                                                                    <div
                                                                        key={p.name}
                                                                        className="api-docs-page-param-row gap-3 py-3 px-4"
                                                                    >
                                                                        <div>
                                                                            <code className="lumo-font-mono lumo-body-medium">
                                                                                {p.name}
                                                                            </code>
                                                                            <div className="lumo-font-mono lumo-body-small lumo-color-glyph-mid">
                                                                                {p.type}
                                                                            </div>
                                                                            {p.required ? (
                                                                                <span className="lumo-label-small lumo-color-signal-danger">
                                                                                    {c('collider_2025: Label')
                                                                                        .t`required`}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="lumo-body-medium lumo-color-glyph-mid">
                                                                                    {c('collider_2025: Label')
                                                                                        .t`optional`}
                                                                                </span>
                                                                            )}
                                                                            {p.default !== undefined && (
                                                                                <div className="mt-1 lumo-body-small lumo-color-glyph-mid">
                                                                                    {c('collider_2025: Label')
                                                                                        .jt`Default: `}
                                                                                    <code className="lumo-font-mono">
                                                                                        {p.default}
                                                                                    </code>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className="m-0 lumo-color-glyph-mid">
                                                                            {p.description}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {ep.id === 'ep-chat-completions' && (
                                                            <div className="mt-6">
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {(
                                                                        Object.keys(
                                                                            CHAT_EXAMPLE_LABELS
                                                                        ) as ChatExampleVariant[]
                                                                    ).map((key) => (
                                                                        <Button
                                                                            key={key}
                                                                            shape={
                                                                                chatExample === key ? 'solid' : 'ghost'
                                                                            }
                                                                            size="small"
                                                                            onClick={() => setChatExample(key)}
                                                                            type="button"
                                                                        >
                                                                            {CHAT_EXAMPLE_LABELS[key]()}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                                <ApiDocsCodeBlock
                                                                    codeByLang={
                                                                        spec.chatExamples[chatExample] as Record<
                                                                            CodeLang,
                                                                            string
                                                                        >
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    </section>
                                                ))}
                                            </div>
                                        ))}
                                    </main>
                                </div>
                            </div>
                        </div>
                    )}

                    {docsTab === 'usage' && (
                        <div className="api-docs-page-body-panel py-6 px-5 w-full min-w-0">
                            {!canViewApiUsage && (
                                <>
                                    <h1 className="mt-0 mb-2 lumo-title-large">
                                        {c('collider_2025: Title').t`API overview`}
                                    </h1>
                                    <p className="mt-0 mb-6 lumo-color-glyph-mid" style={{ lineHeight: 1.6 }}>
                                        {isOrgMember
                                            ? c('collider_2025: Info')
                                                  .t`Monitor your API usage and organization balance status.`
                                            : c('collider_2025: Info')
                                                  .t`Monitor your balance, usage, spending controls, and access.`}
                                    </p>
                                </>
                            )}
                            {isGuest ? (
                                <div className="flex flex-column items-start gap-4 p-6 border radius-12 lumo-bg-control-fill">
                                    <p className="m-0 lumo-color-glyph-mid">
                                        {c('collider_2025: Info')
                                            .t`Sign in to view API usage and balance for ${LUMO_SHORT_APP_NAME}.`}
                                    </p>
                                    <SignInButton color="norm" shape="solid" />
                                </div>
                            ) : isAccessLoading ? (
                                <p className="m-0 lumo-color-glyph-mid">{c('collider_2025: Info').t`Loading…`}</p>
                            ) : apiAccessDenied ? (
                                <ApiAccessDeniedNotice />
                            ) : canViewApiUsage ? (
                                <ApiUsagePanel />
                            ) : !hasLumoApi ? (
                                <ApiNotIncludedNotice />
                            ) : canShowTalkToAdminLumoUpsell && !hasLumoPlus ? (
                                <AskForSeatNotice />
                            ) : (
                                <div className="p-6 border radius-12 lumo-bg-control-fill">
                                    <p className="m-0 lumo-color-glyph-mid">
                                        {c('collider_2025: Info')
                                            .t`API usage is not available for your account at the moment.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {docsTab === 'keys' && (
                        <div className="api-docs-page-body-panel py-6 px-5 w-full min-w-0">
                            {isGuest ? (
                                <div className="flex flex-column items-start gap-4 p-6 border radius-12 lumo-bg-control-fill">
                                    <p className="m-0 lumo-color-glyph-mid">
                                        {c('collider_2025: Info')
                                            .t`Sign in to create and manage API keys for ${LUMO_SHORT_APP_NAME}.`}
                                    </p>
                                    <SignInButton color="norm" shape="solid" />
                                </div>
                            ) : isAccessLoading ? (
                                <p className="m-0 lumo-color-glyph-mid">{c('collider_2025: Info').t`Loading…`}</p>
                            ) : apiAccessDenied ? (
                                <ApiAccessDeniedNotice />
                            ) : canManageApiKeys ? (
                                <ApiKeysPanel />
                            ) : !hasLumoApi ? (
                                <ApiNotIncludedNotice />
                            ) : canShowTalkToAdminLumoUpsell && !hasLumoPlus ? (
                                <AskForSeatNotice />
                            ) : (
                                <div className="p-6 border radius-12 lumo-bg-control-fill">
                                    <p className="m-0 lumo-color-glyph-mid">
                                        {c('collider_2025: Info')
                                            .t`API key management is not available for your account at the moment.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {docsTab === 'workflow' && (
                        <div className="api-docs-page-body-panel py-6 px-5 w-full min-w-0">
                            <WorkflowCodegenPanel isGuest={isGuest} />
                        </div>
                    )}
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};

const SignedInApiDocsPage = () => {
    const [entitlements, isEntitlementsLoading] = useEntitlementChecksForOrgAndUser();
    return <ApiDocsPageContent hasLumoApi={entitlements.hasLumoApi} isEntitlementsLoading={isEntitlementsLoading} />;
};

export const ApiDocsPage = () =>
    useIsGuest() ? (
        <ApiDocsPageContent hasLumoApi={false} isEntitlementsLoading={false} />
    ) : (
        <ErrorBoundary
            component={
                <LumoLayoutWithDrawer drawer={{ disabled: true }}>
                    <GenericError />
                </LumoLayoutWithDrawer>
            }
        >
            <SignedInApiDocsPage />
        </ErrorBoundary>
    );
