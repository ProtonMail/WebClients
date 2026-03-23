import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { c } from 'ttag';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { InputFieldTwo, Select, useApi, useNotifications } from '@proton/components/index';
import { CryptoProxy } from '@proton/crypto/lib';
import type { PublicKeyReference } from '@proton/crypto/lib';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { usePersonalAccessTokenUsage } from '../../../hooks/usePersonalAccessTokenUsage';

import './ApiKeysPanel.scss';
import {
    type CreatePersonalAccessTokenResponse,
    type ListPersonalAccessTokensResponse,
    type PersonalAccessToken,
    createPersonalAccessTokenRequest,
    deletePersonalAccessTokenRequest,
    listPersonalAccessTokensRequest,
} from '../../../remote/personalAccessToken';
import {LUMO_SHORT_APP_NAME} from "@proton/shared/lib/constants";
import {IcCross} from "@proton/icons/icons/IcCross";

const EXPIRATION_OPTIONS = [
    { value: '30', text: c('collider_2025: Option').t`30 days` },
    { value: '90', text: c('collider_2025: Option').t`90 days` },
    { value: '180', text: c('collider_2025: Option').t`180 days` },
    { value: '365', text: c('collider_2025: Option').t`1 year` },
];

const EXPIRING_SOON_THRESHOLD = 7 * 86400; // 7 days

const getExpirationTimestamp = (days: number) => Math.floor(Date.now() / 1000) + days * 86400;

const formatDate = (unixTs: number) =>
    new Date(unixTs * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const getDaysRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 86400);
};

async function buildPersonalAccessTokenKey(publicKey: PublicKeyReference): Promise<string> {
    const tokenKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await CryptoProxy.encryptMessage({
        binaryData: tokenKeyBytes,
        encryptionKeys: publicKey,
        format: 'binary',
    });
    return encrypted.message.toBase64();
}

// ── Token status helpers ──────────────────────────────────────────────────────

type TokenStatus = 'active' | 'expiring' | 'expired';

const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = Math.floor(Date.now() / 1000);
    if (expireTime < now) return 'expired';
    if (expireTime - now < EXPIRING_SOON_THRESHOLD) return 'expiring';
    return 'active';
};

const StatusBadge = ({ status }: { status: TokenStatus }) => {
    const labels: Record<TokenStatus, string> = {
        active: c('collider_2025: Status').t`Active`,
        expiring: c('collider_2025: Status').t`Expiring soon`,
        expired: c('collider_2025: Status').t`Expired`,
    };
    return <span className={`api-keys-status api-keys-status--${status}`}>{labels[status]}</span>;
};

// ── Token reveal ──────────────────────────────────────────────────────────────

const TokenRevealModal = ({ token, onClose }: { token: string; onClose: () => void }) => {
    const { createNotification } = useNotifications();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        void navigator.clipboard.writeText(token);
        setCopied(true);
        createNotification({ text: c('collider_2025: Notification').t`API key copied to clipboard` });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="api-keys-token-reveal">
            <div className="api-keys-token-reveal-overlay" onClick={onClose} />
            <div className="api-keys-token-reveal-dialog">
                <div className="api-keys-token-reveal-header">
                    <div className="api-keys-token-reveal-header-inner">
                        <div className="api-keys-token-reveal-icon">
                            <IcKey size={5} />
                        </div>
                        <div>
                            <h3 className="api-keys-token-reveal-title">
                                {c('collider_2025: Title').t`Your new API key`}
                            </h3>
                            <p className="api-keys-token-reveal-subtitle">
                                {c('collider_2025: Description').t`Keep it safe — it won't be shown again`}
                            </p>
                        </div>
                    </div>
                    <Button icon shape="ghost" size="small" onClick={onClose} title={c('Action').t`Close`}>
                        <IcCross size={4} />
                    </Button>
                </div>

                <div className="api-keys-token-reveal-body">
                    <div className="api-keys-token-warning">
                        <IcExclamationCircle size={4} className="shrink-0" />
                        {c('collider_2025: Warning')
                            .t`This is the only time you'll see this key. Copy it now.`}
                    </div>

                    <div className="api-keys-token-box" onClick={handleCopy}>
                        <span className="api-keys-token-text">{token}</span>
                        <span className={`api-keys-token-copied ${copied ? 'api-keys-token-copied--visible' : ''}`}>
                            {c('collider_2025: Status').t`Copied!`}
                        </span>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Button color="weak" className="flex-1" onClick={onClose}>
                            {c('Action').t`Close`}
                        </Button>

                        <Button color="norm" className="flex-1" onClick={handleCopy}>
                            {c('Action').t`Copy API key`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Create form ───────────────────────────────────────────────────────────────

const CreateKeyForm = ({ onCancel, onCreated }: { onCancel: () => void; onCreated: (token: string) => void }) => {
    const api = useApi();
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();

    const [name, setName] = useState('');
    const [expirationDays, setExpirationDays] = useState('90');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setNameError(c('collider_2025: Error').t`Name is required`);
            return;
        }
        if (name.length > 191) {
            setNameError(c('collider_2025: Error').t`Name must be 191 characters or fewer`);
            return;
        }

        setIsSubmitting(true);
        setNameError('');

        try {
            const userKeys = await getUserKeys();
            const primaryKey = getPrimaryKey(userKeys);

            if (!primaryKey?.publicKey) {
                createNotification({
                    type: 'error',
                    text: c('collider_2025: Error').t`Could not retrieve your encryption key`,
                });
                return;
            }

            const personalAccessTokenKey = await buildPersonalAccessTokenKey(primaryKey.publicKey);
            const response = await api<CreatePersonalAccessTokenResponse>(
                createPersonalAccessTokenRequest({
                    Name: name.trim(),
                    Products: ['lumo'],
                    PersonalAccessTokenKey: personalAccessTokenKey,
                    ExpireTime: getExpirationTimestamp(Number(expirationDays)),
                })
            );

            if (response.PersonalAccessToken.Token) {
                onCreated(response.PersonalAccessToken.Token);
            }
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Failed to create API key`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="api-keys-form-card">
            <h4 className="api-keys-form-title">{c('collider_2025: Title').t`Create new API key`}</h4>

            <div className="api-keys-form-fields">
                <InputFieldTwo
                    id="api-key-name"
                    label={c('Label').t`Key name`}
                    placeholder={c('Placeholder').t`e.g. My automation script`}
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    error={nameError}
                    assistContainerClassName={nameError ? undefined : 'hidden'}
                    maxLength={191}
                    autoFocus
                />
                <div className="api-keys-form-expiry">
                    <label className="api-keys-form-expiry-label" htmlFor="api-key-expiry">
                        {c('Label').t`Expires in`}
                    </label>
                    <Select
                        id="api-key-expiry"
                        value={expirationDays}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setExpirationDays(e.target.value)}
                        options={EXPIRATION_OPTIONS}
                    />
                </div>
            </div>

            <div className="api-keys-form-footer">
                <Button shape="outline" color="weak" onClick={onCancel} disabled={isSubmitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" onClick={handleCreate} loading={isSubmitting} disabled={isSubmitting}>
                    {c('Action').t`Create key`}
                </Button>
            </div>
        </div>
    );
};

// ── Usage sparkline ───────────────────────────────────────────────────────────

const formatTokenCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
};

// 30 naturally varying values for the ghost placeholder
const GHOST_DATA = [3, 5, 7, 4, 8, 6, 3, 5, 9, 4, 7, 6, 3, 8, 5, 4, 7, 3, 6, 9, 4, 5, 8, 3, 7, 6, 4, 8, 5, 7].map(
    (v, i) => ({ Date: String(i), TokenCount: v })
);

const UsageSparkline = ({ tokenId }: { tokenId: string }) => {
    const { days, totalTokenCount, isLoading, error } = usePersonalAccessTokenUsage(tokenId);

    if (isLoading) {
        return <div className="api-keys-usage-skeleton" />;
    }

    const hasUsage = !error && totalTokenCount > 0;

    if (!hasUsage) {
        return (
            <div className="api-keys-usage">
                <div className="api-keys-usage-chart api-keys-usage-chart--ghost" aria-hidden="true">
                    <ResponsiveContainer width="100%" height={28}>
                        <BarChart data={GHOST_DATA} barCategoryGap="25%">
                            <Bar dataKey="TokenCount" radius={[1, 1, 0, 0]} isAnimationActive={false} fill="var(--background-strong)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <span className="api-keys-usage-label">{c('collider_2025: Info').t`No usage yet`}</span>
            </div>
        );
    }

    return (
        <div className="api-keys-usage">
            <div className="api-keys-usage-chart" aria-hidden="true">
                <ResponsiveContainer width="100%" height={28}>
                    <BarChart data={days} barCategoryGap="25%">
                        <Bar dataKey="TokenCount" radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={2}>
                            {days.map((entry) => (
                                <Cell
                                    key={entry.Date}
                                    fill={
                                        entry.TokenCount > 0
                                            ? 'var(--interaction-norm)'
                                            : 'var(--interaction-norm-minor-1)'
                                    }
                                />
                            ))}
                        </Bar>
                        <RechartsTooltip
                            cursor={false}
                            allowEscapeViewBox={{ x: true, y: true }}
                            reverseDirection={{ x: false, y: true }}
                            offset={8}
                            isAnimationActive={false}
                            wrapperStyle={{ zIndex: 2 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as { Date: string; TokenCount: number };
                                if (d.TokenCount === 0) return null;
                                const label = new Date(d.Date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                });
                                return (
                                    <div className="api-keys-chart-tooltip">
                                        <span className="api-keys-chart-tooltip-date">{label}</span>
                                        <span className="api-keys-chart-tooltip-value">
                                            {formatTokenCount(d.TokenCount)} {c('collider_2025: Unit').t`tokens`}
                                        </span>
                                    </div>
                                );
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="api-keys-usage-stats">
                <span className="api-keys-usage-total">{formatTokenCount(totalTokenCount)}</span>
                <span className="api-keys-usage-label">{c('collider_2025: Info').t`tokens / 30d`}</span>
            </div>
        </div>
    );
};

// ── Key card ──────────────────────────────────────────────────────────────────

const ApiKeyCard = ({
    token,
    onDelete,
    isDeleting,
}: {
    token: PersonalAccessToken;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) => {
    const status = getTokenStatus(token.ExpireTime);
    const daysLeft = getDaysRemaining(token.ExpireTime);

    const expiryLabel =
        status === 'expired'
            ? c('collider_2025: Info').t`Expired ` + formatDate(token.ExpireTime)
            : daysLeft === 1
              ? c('collider_2025: Info').t`Expires tomorrow`
              : c('collider_2025: Info').t`Expires ` + formatDate(token.ExpireTime);

    return (
        <div className={`api-keys-card ${status === 'expired' ? 'api-keys-card--expired' : ''}`}>
            <div className="api-keys-card-icon">
                <IcKey size={4} />
            </div>

            <div className="api-keys-card-body">
                <div className="api-keys-card-name">
                    <span>{token.Name}</span>
                    <StatusBadge status={status} />
                </div>
                <div className="api-keys-card-meta">{expiryLabel}</div>
            </div>

            <UsageSparkline tokenId={token.PersonalAccessTokenID} />

            <div className="api-keys-card-actions">
                <Tooltip title={c('Action').t`Delete key`}>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        color="danger"
                        onClick={() => onDelete(token.PersonalAccessTokenID)}
                        loading={isDeleting}
                        disabled={isDeleting}
                        aria-label={c('Action').t`Delete ${token.Name}`}
                    >
                        <IcTrash size={4} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

// ── Main panel ────────────────────────────────────────────────────────────────

const ApiKeysPanel = () => {
    const api = useApi();
    const { createNotification } = useNotifications();

    // Stabilise via refs — same pattern as usePersonalAccessTokenUsage — so that
    // loadTokens has an empty dep array and never changes identity between renders.
    const apiRef = useRef(api);
    apiRef.current = api;
    const createNotificationRef = useRef(createNotification);
    createNotificationRef.current = createNotification;

    const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string | null>(null);

    const loadTokens = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiRef.current<ListPersonalAccessTokensResponse>(
                listPersonalAccessTokensRequest()
            );
            setTokens(response.PersonalAccessTokens.PersonalAccessTokens ?? []);
        } catch {
            createNotificationRef.current({
                type: 'error',
                text: c('collider_2025: Error').t`Failed to load API keys`,
            });
        } finally {
            setIsLoading(false);
        }
    }, []); // stable — api and createNotification accessed via refs

    // React.StrictMode unmounts and remounts every component in development, which
    // would double-fire a plain useEffect(fn, []). The ignore flag ensures the
    // in-flight request's result is discarded on the first (simulated) unmount so
    // only the second (real) mount's request updates state.
    useEffect(() => {
        let ignore = false;

        void (async () => {
            setIsLoading(true);
            try {
                const response = await apiRef.current<ListPersonalAccessTokensResponse>(
                    listPersonalAccessTokensRequest()
                );
                if (!ignore) {
                    setTokens(response.PersonalAccessTokens.PersonalAccessTokens ?? []);
                }
            } catch {
                if (!ignore) {
                    createNotificationRef.current({
                        type: 'error',
                        text: c('collider_2025: Error').t`Failed to load API keys`,
                    });
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, []);

    const handleDelete = async (id: string) => {
        setDeletingIds((prev) => new Set(prev).add(id));
        try {
            await api(deletePersonalAccessTokenRequest(id));
            setTokens((prev) => prev.filter((t) => t.PersonalAccessTokenID !== id));
            createNotification({ text: c('collider_2025: Notification').t`API key deleted` });
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Failed to delete API key`,
            });
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleCreated = (token: string) => {
        setShowCreateForm(false);
        setRevealedToken(token);
        void loadTokens();
    };

    const showNewKeyButton = !showCreateForm;

    return (
        <div className="api-keys-panel">
            {revealedToken && (
                <TokenRevealModal token={revealedToken} onClose={() => setRevealedToken(null)} />
            )}

            {/* Header */}
            <div className="api-keys-header pt-2">
                <p className="api-keys-description">
                    {c('collider_2025: Description')
                        .t`API keys let you access ${LUMO_SHORT_APP_NAME} programmatically. Each key is shown only once upon creation.`}
                </p>
                {showNewKeyButton && (
                    <button
                        className="api-keys-create-btn"
                        onClick={() => setShowCreateForm(true)}
                        type="button"
                    >
                        <IcPlus size={3} />
                        {c('Action').t`New key`}
                    </button>
                )}
            </div>

            {/* Create form */}
            {showCreateForm && (
                <CreateKeyForm onCancel={() => setShowCreateForm(false)} onCreated={handleCreated} />
            )}

            {/* List / empty / loading */}
            {isLoading ? (
                <div className="api-keys-skeleton">
                    <div className="api-keys-skeleton-item" />
                    <div className="api-keys-skeleton-item" />
                </div>
            ) : tokens.length === 0 ? (
                <div className="api-keys-empty">
                    <div className="api-keys-empty-icon">
                        <IcKey size={6} />
                    </div>
                    <p className="api-keys-empty-title">
                        {c('collider_2025: Title').t`No API keys yet`}
                    </p>
                    <p className="api-keys-empty-subtitle">
                        {c('collider_2025: Description')
                            .t`Create a key to integrate ${LUMO_SHORT_APP_NAME} with your scripts and tools.`}
                    </p>
                </div>
            ) : (
                <div className="api-keys-list">
                    {tokens.map((token) => (
                        <ApiKeyCard
                            key={token.PersonalAccessTokenID}
                            token={token}
                            onDelete={handleDelete}
                            isDeleting={deletingIds.has(token.PersonalAccessTokenID)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApiKeysPanel;
