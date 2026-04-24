import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import {
    deletePersonalAccessToken,
    listPersonalAccessTokens,
} from '@proton/pass/lib/access-token/access-token.requests';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { AccessTokenCard } from './AccessTokenCard';
import { CreateTokenModal } from './CreateTokenModal';
import { ManageAccessModal } from './ManageAccessModal';
import { TokenRevealModal } from './TokenRevealModal';

type Action =
    | { type: 'create' }
    | { type: 'delete'; token: PersonalAccessToken }
    | { type: 'manage-access'; token: PersonalAccessToken };

const AccessTokensList: FC = () => {
    const { createNotification } = useNotifications();

    const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [action, setAction] = useState<Action | null>(null);
    const [reveal, setReveal] = useState<{ envVar: string; agent: boolean } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        void (async () => {
            setIsLoading(true);
            try {
                const result = await listPersonalAccessTokens();
                if (!ignore) setTokens(result);
            } catch {
                if (!ignore) {
                    createNotification({
                        type: 'error',
                        text: c('pass_2026: Error').t`Failed to load access tokens`,
                    });
                }
            } finally {
                if (!ignore) setIsLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, []);

    const handleCreated = (envVar: string, pat: PersonalAccessToken, agent: boolean) => {
        setTokens((prev) => [pat, ...prev.filter((t) => t.PersonalAccessTokenID !== pat.PersonalAccessTokenID)]);
        setAction(null);
        setReveal({ envVar, agent });
    };

    const handleDelete = async () => {
        if (action?.type !== 'delete') return;
        const id = action.token.PersonalAccessTokenID;
        setDeletingId(id);
        try {
            await deletePersonalAccessToken(id);
            setTokens((prev) => prev.filter((t) => t.PersonalAccessTokenID !== id));
            createNotification({ text: c('pass_2026: Notification').t`Access token deleted` });
            setAction(null);
        } catch {
            createNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to delete access token`,
            });
        } finally {
            setDeletingId(null);
        }
    };

    const newKeyButton = (
        <Button
            color="norm"
            pill
            shape="solid"
            size="small"
            onClick={() => setAction({ type: 'create' })}
            className="flex items-center gap-1"
        >
            <IcPlus size={3} />
            {c('pass_2026: Action').t`New token`}
        </Button>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center py-6">
                    <CircleLoader size="medium" />
                </div>
            );
        }

        if (tokens.length === 0) {
            return (
                <div className="flex flex-column items-center text-center py-6 gap-2">
                    <div
                        className="flex items-center justify-center rounded-full bg-weak"
                        style={{ width: '3rem', height: '3rem' }}
                    >
                        <IcKey size={6} />
                    </div>
                    <strong>{c('pass_2026: Title').t`No access tokens yet`}</strong>
                    <span className="color-weak text-sm">
                        {c('pass_2026: Info')
                            .t`Create a token to integrate ${PASS_APP_NAME} with your scripts and tools.`}
                    </span>
                    <div className="mt-2">{newKeyButton}</div>
                </div>
            );
        }

        return (
            <div className="flex flex-column gap-2">
                {tokens.map((token) => (
                    <AccessTokenCard
                        key={token.PersonalAccessTokenID}
                        token={token}
                        onDelete={(t) => setAction({ type: 'delete', token: t })}
                        onManageAccess={(t) => setAction({ type: 'manage-access', token: t })}
                    />
                ))}
            </div>
        );
    };

    const passCliLink = (
        <Href key="pass-cli-link" href="https://protonpass.github.io/pass-cli/">
            pass-cli
        </Href>
    );

    return (
        <>
            <SettingsPanel
                title={c('pass_2026: Label').t`Access tokens`}
                subTitle={
                    <span className="block mt-2">
                        {c('pass_2026: Info')
                            .jt`Access tokens, used together with ${passCliLink}, allow you to automate CI/CD or give your AI agent scoped access to what it needs to run its job.`}
                    </span>
                }
                actions={tokens.length > 0 && !isLoading ? [newKeyButton] : undefined}
                contentClassname="flex flex-column flex-nowrap pt-6 pb-2"
            >
                {renderContent()}
            </SettingsPanel>

            {action?.type === 'create' && (
                <CreateTokenModal onClose={() => setAction(null)} onCreated={handleCreated} />
            )}

            {action?.type === 'manage-access' && (
                <ManageAccessModal
                    token={action.token}
                    onClose={() => setAction(null)}
                    onSaved={() => setAction(null)}
                />
            )}

            {action?.type === 'delete' && (
                <ConfirmationPrompt
                    danger
                    title={c('pass_2026: Title').t`Delete access token?`}
                    message={c('pass_2026: Info')
                        .t`"${action.token.Name}" will stop working immediately. This action cannot be undone.`}
                    confirmText={c('Action').t`Delete`}
                    loading={deletingId === action.token.PersonalAccessTokenID}
                    onCancel={() => setAction(null)}
                    onConfirm={handleDelete}
                />
            )}

            {reveal && <TokenRevealModal envVar={reveal.envVar} agent={reveal.agent} onClose={() => setReveal(null)} />}
        </>
    );
};

const AccessTokensUpgrade: FC = () => (
    <SettingsPanel title={c('pass_2026: Label').t`Access tokens`}>
        <div className="flex flex-column items-center text-center py-6 gap-3">
            <div
                className="flex items-center justify-center rounded-full bg-weak"
                style={{ width: '3rem', height: '3rem' }}
            >
                <IcKey size={6} />
            </div>
            <strong>{c('pass_2026: Title').t`Access tokens require ${PASS_APP_NAME} Plus`}</strong>
            <span className="color-weak text-sm max-w-custom" style={{ '--max-w-custom': '28rem' }}>
                {c('pass_2026: Info')
                    .t`Upgrade to ${PASS_APP_NAME} Plus to create access tokens and use ${PASS_APP_NAME} programmatically.`}
            </span>
            <UpgradeButton upsellRef={UpsellRef.SETTING} />
        </div>
    </SettingsPanel>
);

export const AccessTokens: FC = () => {
    const passPlan = useSelector(selectPassPlan);
    const hasAccess = passPlan !== UserPassPlan.FREE;

    if (!hasAccess) return <AccessTokensUpgrade />;
    return <AccessTokensList />;
};
