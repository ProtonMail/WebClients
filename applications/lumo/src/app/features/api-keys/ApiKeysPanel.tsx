import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components/index';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import {
    getLoadingUsageState,
    useAllPersonalAccessTokensUsage,
} from '../../hooks/usePersonalAccessTokenUsage';
import {
    deletePersonalAccessTokenRequest,
    listPersonalAccessTokensRequest,
    type ListPersonalAccessTokensResponse,
    type PersonalAccessToken,
} from '../../remote/personalAccessToken';
import { ApiKeyCard } from './ApiKeyCard';
import { ApiKeysUsageOverview } from './ApiKeyUsageCharts';
import { CreateKeyForm } from './CreateKeyForm';
import { TokenRevealModal } from './TokenRevealModal';

import './ApiKeysPanel.scss';

const ApiKeysPanel = () => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const apiRef = useRef(api);
    apiRef.current = api;
    const createNotificationRef = useRef(createNotification);
    createNotificationRef.current = createNotification;

    const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string | null>(null);

    const tokenIds = useMemo(() => tokens.map((t) => t.PersonalAccessTokenID), [tokens]);
    const { byId, aggregate, isLoading: usageBatchLoading, error: usageBatchError } =
        useAllPersonalAccessTokensUsage(tokenIds);

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
    }, []);

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
        <div className="api-keys-panel flex flex-column gap-5 w-full">
            {revealedToken && (
                <TokenRevealModal token={revealedToken} onClose={() => setRevealedToken(null)} />
            )}

            <div className="flex items-center justify-space-between gap-4 pt-2">
                <p className="api-keys-description m-0 flex-1">
                    {c('collider_2025: Description')
                        .t`API keys let you access ${LUMO_SHORT_APP_NAME} programmatically. Each key is shown only once upon creation.`}
                </p>
                {showNewKeyButton && (
                    <button
                        className="api-keys-create-btn inline-flex items-center gap-1.5 shrink-0 rounded-lg"
                        onClick={() => setShowCreateForm(true)}
                        type="button"
                    >
                        <IcPlus size={3} />
                        {c('Action').t`New key`}
                    </button>
                )}
            </div>

            {showCreateForm && (
                <CreateKeyForm onCancel={() => setShowCreateForm(false)} onCreated={handleCreated} />
            )}

            {isLoading ? (
                <div className="flex flex-column gap-2">
                    <div className="api-keys-skeleton-item" />
                    <div className="api-keys-skeleton-item" />
                </div>
            ) : tokens.length === 0 ? (
                <div className="flex flex-column items-center justify-center text-center gap-3 pt-12 pb-8">
                    <div className="api-keys-empty-icon flex items-center justify-center rounded-xl">
                        <IcKey size={6} />
                    </div>
                    <p className="api-keys-empty-title m-0">{c('collider_2025: Title').t`No API keys yet`}</p>
                    <p className="api-keys-empty-subtitle m-0">
                        {c('collider_2025: Description')
                            .t`Create a key to integrate ${LUMO_SHORT_APP_NAME} with your scripts and tools.`}
                    </p>
                </div>
            ) : (
                <>
                    <ApiKeysUsageOverview
                        totalTokens={aggregate.totalTokens}
                        totalApiCalls={aggregate.totalApiCalls}
                        isLoading={usageBatchLoading}
                        error={usageBatchError}
                    />
                    <div className="flex flex-column gap-2">
                        {tokens.map((token) => (
                            <ApiKeyCard
                                key={token.PersonalAccessTokenID}
                                token={token}
                                usage={byId[token.PersonalAccessTokenID] ?? getLoadingUsageState()}
                                onDelete={handleDelete}
                                isDeleting={deletingIds.has(token.PersonalAccessTokenID)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ApiKeysPanel;
