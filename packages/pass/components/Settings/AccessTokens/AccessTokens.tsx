import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { deleteAccessToken, getAccessTokens } from '@proton/pass/store/actions';
import { selectAccessTokens, selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { AccessTokenCard } from './AccessTokenCard';
import { CreateTokenModal } from './CreateTokenModal';
import { ManageAccessModal } from './ManageAccessModal';
import { TokenRevealModal } from './TokenRevealModal';
import { ViewActionsModal } from './ViewActionsModal';

type Action =
    | { type: 'create' }
    | { type: 'delete'; token: PersonalAccessToken }
    | { type: 'manage-access'; token: PersonalAccessToken }
    | { type: 'view-actions'; token: PersonalAccessToken };

const AccessTokensList: FC = () => {
    const tokens = useSelector(selectAccessTokens);
    const list = useRequest(getAccessTokens, { loading: true });
    const remove = useRequest(deleteAccessToken);

    const [action, setAction] = useState<Action | null>(null);
    const [reveal, setReveal] = useState<{ envVar: string; agent: boolean } | null>(null);

    useEffect(() => list.dispatch(), []);

    const handleCreated = (envVar: string, _pat: PersonalAccessToken, agent: boolean) => {
        setAction(null);
        setReveal({ envVar, agent });
    };

    const handleDelete = () => {
        if (action?.type !== 'delete') return;
        remove.dispatch(action.token.PersonalAccessTokenID);
        setAction(null);
    };

    const createNewTokenBtn = (
        <Button
            color="weak"
            shape="solid"
            onClick={() => setAction({ type: 'create' })}
            className="flex items-center gap-1 shrink-0"
        >
            <IcPlus size={3} />
            {c('pass_2026: Action').t`New token`}
        </Button>
    );

    const renderContent = () => {
        if (!list.loading && tokens.length === 0) {
            return (
                <div className="flex flex-column items-center text-center py-6 gap-2">
                    <strong>{c('pass_2026: Title').t`No access tokens yet`}</strong>
                    <span className="color-weak text-sm">
                        {c('pass_2026: Info')
                            .t`Create a token to integrate ${PASS_APP_NAME} with your scripts and tools.`}
                    </span>
                    <div className="mt-2">{createNewTokenBtn}</div>
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
                        onViewActions={(t) => setAction({ type: 'view-actions', token: t })}
                    />
                ))}

                {createNewTokenBtn}
            </div>
        );
    };

    return (
        <>
            {renderContent()}

            {action?.type === 'create' && (
                <CreateTokenModal onClose={() => setAction(null)} onCreated={handleCreated} />
            )}

            {action?.type === 'manage-access' && (
                <ManageAccessModal token={action.token} onClose={() => setAction(null)} />
            )}

            {action?.type === 'view-actions' && (
                <ViewActionsModal token={action.token} onClose={() => setAction(null)} />
            )}

            {action?.type === 'delete' && (
                <ConfirmationPrompt
                    danger
                    title={c('pass_2026: Title').t`Delete access token?`}
                    message={c('pass_2026: Info')
                        .t`"${action.token.Name}" will stop working immediately. This action cannot be undone.`}
                    confirmText={c('Action').t`Delete`}
                    loading={remove.loading}
                    onCancel={() => setAction(null)}
                    onConfirm={handleDelete}
                />
            )}

            {reveal && <TokenRevealModal envVar={reveal.envVar} agent={reveal.agent} onClose={() => setReveal(null)} />}
        </>
    );
};

const AccessTokensUpgrade: FC = () => (
    <div className="flex flex-column items-center text-center py-6 gap-3">
        <strong>{c('pass_2026: Title').t`Access tokens require ${PASS_APP_NAME} Plus`}</strong>
        <span className="color-weak text-sm max-w-custom" style={{ '--max-w-custom': '28rem' }}>
            {c('pass_2026: Info')
                .t`Upgrade to ${PASS_APP_NAME} Plus to create access tokens and use ${PASS_APP_NAME} programmatically.`}
        </span>
        <UpgradeButton upsellRef={UpsellRef.SETTING} />
    </div>
);

export const AccessTokens: FC = () => {
    const passPlan = useSelector(selectPassPlan);
    const hasAccess = passPlan !== UserPassPlan.FREE;

    const passCliLink = (
        <Href key="pass-cli-link" href="https://protonpass.github.io/pass-cli/">
            pass-cli
        </Href>
    );

    return (
        <SettingsPanel
            contentClassname="flex flex-column flex-nowrap pt-6 pb-2"
            title={
                <span className="flex items-center gap-1.5">
                    <IcKey size={3.5} /> {c('pass_2026: Label').t`Access tokens`}
                </span>
            }
            subTitle={
                <span className="block mt-2">
                    {c('pass_2026: Info')
                        .jt`Access tokens, used together with ${passCliLink}, allow you to automate CI/CD or give your AI agent scoped access to what it needs to run its job.`}
                </span>
            }
        >
            {!hasAccess ? <AccessTokensUpgrade /> : <AccessTokensList />}
        </SettingsPanel>
    );
};
