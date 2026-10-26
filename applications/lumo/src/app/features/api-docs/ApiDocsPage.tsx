import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME, LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { SignInButton } from '../../components/Guest/SignInLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useIsGuest } from '../../providers/IsGuestProvider';
import {
    useDebugApiAccessDenied,
    useDebugApiOrganizationMemberView,
    useDebugApiOrganizationView,
} from '../../services/apiUsageDebugStore';
import GetLumoPlusButton from '../../upsells/primitives/GetLumoPlusButton';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
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
            className="text-monospace text-xs font-bold px-1 py-0.5 rounded-sm"
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

const StatusBadge = ({ status }: { status: 'ga' | 'beta' }) =>
    status === 'ga' ? (
        <span className="text-2xs uppercase font-bold px-1.5 py-0.5 rounded-sm bg-success color-norm">
            {c('collider_2025: Badge').t`GA`}
        </span>
    ) : (
        <span className="text-2xs uppercase font-bold px-1.5 py-0.5 rounded-sm bg-warning color-norm">
            {c('collider_2025: Badge').t`Beta`}
        </span>
    );

const ApiAccessDeniedNotice = () => (
    <div className="flex flex-column gap-2 items-start rounded-lg border border-weak p-6 bg-weak">
        <strong>{c('collider_2025: Title').t`API access is not enabled`}</strong>
        <p className="m-0 color-weak">
            {c('collider_2025: Info')
                .t`Your organization has not allowed API access for your account. Contact your organization administrator to request access.`}
        </p>
    </div>
);

export const ApiDocsPage = () => {
    const history = useHistory();
    const location = useLocation();
    const { apiKeyManagement } = useLumoFlags();
    const isGuest = useIsGuest();
    const { hasLumoPlus, isLumoPlanLoading, canShowTalkToAdminLumoUpsell, isOrgAdmin, userIsMember } = useLumoPlan();
    const debugOrganizationView = useDebugApiOrganizationView();
    const debugOrganizationMemberView = useDebugApiOrganizationMemberView();
    const lumoPlusUpsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.SETTINGS_MODAL);
    const spec = LUMO_API_DOCS_SPEC;

    const effectiveOrgAdmin = isOrgAdmin || debugOrganizationView;
    const isOrgMember = debugOrganizationMemberView || (!effectiveOrgAdmin && userIsMember);
    const debugApiAccessDenied = useDebugApiAccessDenied();
    const apiAccessDenied = isOrgMember && debugApiAccessDenied;
    const canManageApiKeys = !isGuest && apiKeyManagement && hasLumoPlus && !apiAccessDenied;
    /** Organization preview only reveals mocked UI and does not grant backend permissions. */
    const canViewApiUsage =
        !apiAccessDenied &&
        !isGuest &&
        apiKeyManagement &&
        (hasLumoPlus || effectiveOrgAdmin || debugOrganizationMemberView);

    const [docsTab, setDocsTab] = useState<DocsTab>('api');
    const [activeNav, setActiveNav] = useState('overview');
    const [chatExample, setChatExample] = useState<ChatExampleVariant>('basic');
    const [apiModelsState, setApiModelsState] = useState<ApiModelsState>({ status: 'loading', models: [] });
    const [apiModelsReload, setApiModelsReload] = useState(0);

    useEffect(() => {
        const abortController = new AbortController();
        setApiModelsState((current) => ({ status: 'loading', models: current.models }));

        void fetchApiModels(spec.apiBaseUrl, abortController.signal)
            .then((models) => setApiModelsState({ status: 'success', models }))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                setApiModelsState((current) => ({ status: 'error', models: current.models }));
            });

        return () => abortController.abort();
    }, [apiModelsReload, spec.apiBaseUrl]);

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
                className="api-docs-page-tabs flex flex-wrap"
                role="tablist"
                aria-label={c('collider_2025: Title').t`API docs sections`}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'usage'}
                    className={clsx('api-docs-page-tab', docsTab === 'usage' && 'is-active')}
                    onClick={() => selectDocsTab('usage')}
                >
                    {c('collider_2025: Tab').t`Overview`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'api'}
                    className={clsx('api-docs-page-tab', docsTab === 'api' && 'is-active')}
                    onClick={() => selectDocsTab('api')}
                >
                    {c('collider_2025: Tab').t`Docs`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'keys'}
                    className={clsx('api-docs-page-tab', docsTab === 'keys' && 'is-active')}
                    onClick={() => selectDocsTab('keys')}
                >
                    {c('collider_2025: Tab').t`API keys`}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={docsTab === 'workflow'}
                    className={clsx('api-docs-page-tab', docsTab === 'workflow' && 'is-active')}
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
                        <div className="api-docs-page-body-panel w-full min-w-0">
                            <div className="api-docs-page-layout">
                                <nav
                                    className="api-docs-page-nav"
                                    aria-label={c('collider_2025: Title').t`API documentation`}
                                >
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link block w-full text-left',
                                            activeNav === 'overview' && 'is-active'
                                        )}
                                        onClick={() => handleNav('overview')}
                                    >
                                        {c('collider_2025: Nav').t`Overview`}
                                    </button>
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link block w-full text-left',
                                            activeNav === 'authentication' && 'is-active'
                                        )}
                                        onClick={() => handleNav('authentication')}
                                    >
                                        {c('collider_2025: Nav').t`Authentication`}
                                    </button>
                                    <button
                                        type="button"
                                        className={clsx(
                                            'api-docs-page-nav-link block w-full text-left',
                                            activeNav === 'models' && 'is-active'
                                        )}
                                        onClick={() => handleNav('models')}
                                    >
                                        {c('collider_2025: Nav').t`Models & pricing`}
                                    </button>
                                    <div className="api-docs-page-nav-group-label">{c('collider_2025: Nav')
                                        .t`Endpoints`}</div>
                                    {spec.endpointGroups.map((group) => (
                                        <div key={group.id}>
                                            <div className="api-docs-page-nav-group-label">{groupTitle(group.id)}</div>
                                            {group.endpoints.map((ep) => (
                                                <button
                                                    key={ep.id}
                                                    type="button"
                                                    className={clsx(
                                                        'api-docs-page-nav-endpoint flex items-center gap-1.5 w-full text-left',
                                                        activeNav === ep.id && 'is-active'
                                                    )}
                                                    onClick={() => handleNav(ep.id)}
                                                >
                                                    <MethodBadge method={ep.method} />
                                                    <span className="text-monospace">{ep.path}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </nav>

                                <div className="api-docs-page-main-wrap flex justify-center">
                                    <main className="api-docs-page-main w-full min-w-0">
                                        <section id="overview" className="api-docs-page-section-anchor mb-14">
                                            <div className="api-docs-page-hero">
                                                <div className="api-docs-page-hero-eyebrow">
                                                    {c('collider_2025: Title')
                                                        .t`${LUMO_SHORT_APP_NAME} API · ${spec.versionLabel}`}
                                                </div>
                                                <h1 className="api-docs-page-hero-title">
                                                    {c('collider_2025: Title').t`Build intelligent apps.`}
                                                    <br />
                                                    <span className="api-docs-page-hero-title-accent">
                                                        {c('collider_2025: Title').t`Privacy included by default.`}
                                                    </span>
                                                </h1>
                                                <p className="api-docs-page-hero-text">
                                                    {c('collider_2025: Info')
                                                        .t`The ${LUMO_SHORT_APP_NAME} API gives you programmatic access to language models with ${BRAND_NAME}'s privacy architecture built in. No data training on your requests. No tracking.`}
                                                </p>
                                                <ApiBaseUrlBar url={spec.apiBaseUrl} />
                                            </div>

                                            <section aria-labelledby="api-getting-started-title" className="mb-10">
                                                <h2
                                                    id="api-getting-started-title"
                                                    className="text-bold text-2xl mt-0 mb-2"
                                                >
                                                    {c('collider_2025: Title').t`Getting started`}
                                                </h2>
                                                <p className="color-weak mt-0 mb-4" style={{ lineHeight: 1.7 }}>
                                                    {isOrgMember
                                                        ? c('collider_2025: Info')
                                                              .t`Check your organization access and create credentials before making your first API request.`
                                                        : c('collider_2025: Info')
                                                              .t`Set up billing and authentication before making your first API request.`}
                                                </p>
                                                <div className="api-docs-page-getting-started-grid">
                                                    <article className="api-docs-page-getting-started-step flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center rounded-full mb-3">
                                                            1
                                                        </span>
                                                        <h3 className="text-base text-bold m-0 mb-1">
                                                            {isOrgMember
                                                                ? c('collider_2025: Title').t`Check organization access`
                                                                : c('collider_2025: Title').t`Top up balance`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none text-sm color-weak m-0 mb-4">
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

                                                    <article className="api-docs-page-getting-started-step flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center rounded-full mb-3">
                                                            2
                                                        </span>
                                                        <h3 className="text-base text-bold m-0 mb-1">
                                                            {c('collider_2025: Title').t`Generate an API key`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none text-sm color-weak m-0 mb-4">
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

                                                    <article className="api-docs-page-getting-started-step flex flex-column">
                                                        <span className="api-docs-page-step-number flex items-center justify-center rounded-full mb-3">
                                                            3
                                                        </span>
                                                        <h3 className="text-base text-bold m-0 mb-1">
                                                            {c('collider_2025: Title').t`Make your first request`}
                                                        </h3>
                                                        <p className="api-docs-page-getting-started-copy flex-none text-sm color-weak m-0 mb-4">
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

                                            <h2 className="text-bold text-2xl mt-0 mb-2">{c('collider_2025: Title')
                                                .t`What you can build`}</h2>
                                            <p
                                                className="color-weak mb-4"
                                                style={{ lineHeight: 1.7, maxWidth: '40rem' }}
                                            >
                                                {c('collider_2025: Info')
                                                    .t`The ${LUMO_SHORT_APP_NAME} API is a RESTful interface that follows the OpenAI API schema — drop in your existing client with a one-line change.`}
                                            </p>

                                            <div className="api-docs-page-feature-grid">
                                                <div className="api-docs-page-feature-card">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center rounded-lg mb-3"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="Zap" size={18} />
                                                    </div>
                                                    <div className="text-semibold mb-1">{c('collider_2025: Title')
                                                        .t`Workflow automation`}</div>
                                                    <p className="m-0 text-sm color-weak">
                                                        {c('collider_2025: Info')
                                                            .t`Chain tool calls to orchestrate multi-step pipelines end-to-end.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-feature-card">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center rounded-lg mb-3"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="PencilSparkles" size={18} />
                                                    </div>
                                                    <div className="text-semibold mb-1">{c('collider_2025: Title')
                                                        .t`Document intelligence`}</div>
                                                    <p className="m-0 text-sm color-weak">
                                                        {c('collider_2025: Info')
                                                            .t`Extract, analyze, and summarise documents, PDFs, and images.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-feature-card">
                                                    <div
                                                        className="api-docs-page-feature-icon flex items-center justify-center rounded-lg mb-3"
                                                        aria-hidden
                                                    >
                                                        <LumoIcon name="MessagesSquare" size={18} />
                                                    </div>
                                                    <div className="text-semibold mb-1">{c('collider_2025: Title')
                                                        .t`Conversational AI`}</div>
                                                    <p className="m-0 text-sm color-weak">
                                                        {c('collider_2025: Info')
                                                            .t`Build privacy-first assistants with streaming and persistent context.`}
                                                    </p>
                                                </div>
                                            </div>

                                            <h3 className="text-lg text-bold mb-3">{c('collider_2025: Title')
                                                .t`API endpoints overview`}</h3>
                                            <div className="api-docs-page-endpoint-table">
                                                <div className="api-docs-page-endpoint-head">
                                                    <span>{c('collider_2025: Label').t`Method`}</span>
                                                    <span>{c('collider_2025: Label').t`Path`}</span>
                                                    <span>{c('collider_2025: Label').t`Description`}</span>
                                                    <span>{c('collider_2025: Label').t`Status`}</span>
                                                </div>
                                                {flatEndpoints.map((ep) => (
                                                    <button
                                                        key={ep.id}
                                                        type="button"
                                                        className="api-docs-page-endpoint-row text-left"
                                                        onClick={() => handleNav(ep.id)}
                                                    >
                                                        <span>
                                                            <MethodBadge method={ep.method} />
                                                        </span>
                                                        <code className="text-monospace text-sm">{ep.path}</code>
                                                        <span className="color-weak text-sm">{ep.description}</span>
                                                        <StatusBadge status={ep.status} />
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <div className="border-top border-weak mb-10" />

                                        <section id="authentication" className="api-docs-page-section-anchor mb-14">
                                            <h2 className="text-bold text-xl mt-0 mb-2">{c('collider_2025: Title')
                                                .t`Authentication`}</h2>
                                            <p className="color-weak mb-4" style={{ lineHeight: 1.7 }}>
                                                {c('collider_2025: Info')
                                                    .t`All API requests must include your API key in the `}
                                                <code className="text-monospace px-1 py-0.5 rounded-sm bg-weak">
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

                                            <h3 className="text-base text-bold mb-2">{c('collider_2025: Title')
                                                .t`Required headers`}</h3>
                                            <div className="api-docs-page-param-table mb-4">
                                                <div className="api-docs-page-param-row">
                                                    <div>
                                                        <code className="text-monospace text-semibold">
                                                            Authorization
                                                        </code>
                                                        <div className="text-xs color-hint text-monospace">string</div>
                                                        <span className="text-xs color-danger text-bold">{c(
                                                            'collider_2025: Label'
                                                        ).t`required`}</span>
                                                    </div>
                                                    <p className="m-0 color-weak">
                                                        {c('collider_2025: Info')
                                                            .t`Authenticates the request. Never expose this in client-side code.`}
                                                    </p>
                                                </div>
                                                <div className="api-docs-page-param-row">
                                                    <div>
                                                        <code className="text-monospace text-semibold">
                                                            Content-Type
                                                        </code>
                                                        <div className="text-xs color-hint text-monospace">
                                                            application/json
                                                        </div>
                                                        <span className="text-xs color-danger text-bold">{c(
                                                            'collider_2025: Label'
                                                        ).t`required`}</span>
                                                    </div>
                                                    <p className="m-0 color-weak">
                                                        {c('collider_2025: Info')
                                                            .t`Required on all POST requests with a JSON body.`}
                                                    </p>
                                                </div>
                                            </div>

                                            <ApiDocsCodeBlock codeByLang={spec.authExamples} />

                                            <div className="rounded-lg border border-weak p-4 mt-4 bg-weak">
                                                <strong>{c('collider_2025: Title').t`Security note:`}</strong>{' '}
                                                {c('collider_2025: Info')
                                                    .t`Never embed API keys in client-side bundles. Use environment variables and a server-side proxy in production.`}
                                            </div>
                                        </section>

                                        <div className="border-top border-weak mb-10" />

                                        <ApiModelsCatalogSection
                                            status={apiModelsState.status}
                                            models={apiModelsState.models}
                                            onRetry={() => setApiModelsReload((value) => value + 1)}
                                        />

                                        <div className="border-top border-weak mb-10" />

                                        {spec.endpointGroups.map((group) => (
                                            <div key={group.id}>
                                                <div className="flex items-center gap-3 mt-8 mb-5">
                                                    <h2 className="text-bold text-xl m-0">{groupTitle(group.id)}</h2>
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
                                                            <code className="text-monospace text-base">{ep.path}</code>
                                                            <StatusBadge status={ep.status} />
                                                            {ep.openaiCompatible && (
                                                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-weak color-primary">
                                                                    {c('collider_2025: Badge').t`OpenAI-compatible`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="color-weak mb-4" style={{ lineHeight: 1.7 }}>
                                                            {ep.description}
                                                        </p>
                                                        {ep.parameters && ep.parameters.length > 0 && (
                                                            <div className="api-docs-page-param-table">
                                                                <div className="api-docs-page-param-head">{c(
                                                                    'collider_2025: Title'
                                                                ).t`Parameters`}</div>
                                                                {ep.parameters.map((p) => (
                                                                    <div
                                                                        key={p.name}
                                                                        className="api-docs-page-param-row"
                                                                    >
                                                                        <div>
                                                                            <code className="text-monospace text-semibold">
                                                                                {p.name}
                                                                            </code>
                                                                            <div className="text-xs color-hint text-monospace">
                                                                                {p.type}
                                                                            </div>
                                                                            {p.required ? (
                                                                                <span className="text-xs color-danger font-bold">
                                                                                    {c('collider_2025: Label')
                                                                                        .t`required`}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs color-hint">
                                                                                    {c('collider_2025: Label')
                                                                                        .t`optional`}
                                                                                </span>
                                                                            )}
                                                                            {p.default !== undefined && (
                                                                                <div className="text-xs color-hint mt-1">
                                                                                    {c('collider_2025: Label')
                                                                                        .jt`Default: `}
                                                                                    <code className="text-monospace">
                                                                                        {p.default}
                                                                                    </code>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className="m-0 color-weak">
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
                        <div className="api-docs-page-body-panel w-full min-w-0">
                            {!canViewApiUsage && (
                                <>
                                    <h1 className="text-bold text-2xl mt-0 mb-2">
                                        {c('collider_2025: Title').t`API overview`}
                                    </h1>
                                    <p className="color-weak mt-0 mb-6" style={{ lineHeight: 1.6 }}>
                                        {isOrgMember
                                            ? c('collider_2025: Info')
                                                  .t`Monitor your API usage and organization balance status.`
                                            : c('collider_2025: Info')
                                                  .t`Monitor your balance, usage, spending controls, and access.`}
                                    </p>
                                </>
                            )}
                            {isGuest ? (
                                <div className="flex flex-column gap-4 items-start rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`Sign in to view API usage and balance for ${LUMO_SHORT_APP_NAME}.`}
                                    </p>
                                    <SignInButton color="norm" shape="solid" />
                                </div>
                            ) : isLumoPlanLoading ? (
                                <p className="m-0 color-weak">{c('collider_2025: Info').t`Loading…`}</p>
                            ) : apiAccessDenied ? (
                                <ApiAccessDeniedNotice />
                            ) : canViewApiUsage ? (
                                <ApiUsagePanel />
                            ) : canShowTalkToAdminLumoUpsell && !hasLumoPlus ? (
                                <div className="rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`API usage is available with ${LUMO_SHORT_APP_NAME}+. Ask your organization administrator to assign a ${LUMO_SHORT_APP_NAME} seat to your account.`}
                                    </p>
                                </div>
                            ) : !hasLumoPlus ? (
                                <div
                                    className="flex flex-column gap-4 items-start rounded-lg border border-weak p-6 bg-weak"
                                    style={{ maxWidth: '36rem' }}
                                >
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`API usage and balance are available for ${LUMO_SHORT_APP_NAME}+ subscribers.`}
                                    </p>
                                    {lumoPlusUpsellConfig ? (
                                        <GetLumoPlusButton
                                            path={lumoPlusUpsellConfig.path}
                                            onClick={lumoPlusUpsellConfig.onUpgrade}
                                            className={lumoPlusUpsellConfig.className}
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`API usage is not available for your account at the moment.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {docsTab === 'keys' && (
                        <div className="api-docs-page-body-panel w-full min-w-0">
                            {isGuest ? (
                                <div className="flex flex-column gap-4 items-start rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`Sign in to create and manage API keys for ${LUMO_SHORT_APP_NAME}.`}
                                    </p>
                                    <SignInButton color="norm" shape="solid" />
                                </div>
                            ) : isLumoPlanLoading ? (
                                <p className="m-0 color-weak">{c('collider_2025: Info').t`Loading…`}</p>
                            ) : apiAccessDenied ? (
                                <ApiAccessDeniedNotice />
                            ) : canManageApiKeys ? (
                                <ApiKeysPanel />
                            ) : canShowTalkToAdminLumoUpsell && !hasLumoPlus ? (
                                <div className="rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`API keys are included with ${LUMO_SHORT_APP_NAME}+. Ask your organization administrator to assign a ${LUMO_SHORT_APP_NAME} seat to your account.`}
                                    </p>
                                </div>
                            ) : !hasLumoPlus ? (
                                <div
                                    className="flex flex-column gap-4 items-start rounded-lg border border-weak p-6 bg-weak"
                                    style={{ maxWidth: '36rem' }}
                                >
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`Upgrade to ${LUMO_SHORT_APP_NAME}+ to create API keys and use the API programmatically.`}
                                    </p>
                                    {lumoPlusUpsellConfig ? (
                                        <GetLumoPlusButton
                                            path={lumoPlusUpsellConfig.path}
                                            onClick={lumoPlusUpsellConfig.onUpgrade}
                                            className={lumoPlusUpsellConfig.className}
                                        />
                                    ) : null}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-weak p-6 bg-weak">
                                    <p className="m-0 color-weak">
                                        {c('collider_2025: Info')
                                            .t`API key management is not available for your account at the moment.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {docsTab === 'workflow' && (
                        <div className="api-docs-page-body-panel w-full min-w-0">
                            <WorkflowCodegenPanel isGuest={isGuest} />
                        </div>
                    )}
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
