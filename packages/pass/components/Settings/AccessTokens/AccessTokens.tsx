import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { getTokenStatus } from '@proton/pass/lib/access-token/access-token.utils';
import { deleteAccessToken, getAccessTokens } from '@proton/pass/store/actions';
import { selectAccessTokens, selectPassPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { partition } from '@proton/pass/utils/array/partition';
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

    const [action, setAction] = useState<MaybeNull<Action>>(null);
    const [reveal, setReveal] = useState<MaybeNull<{ envVar: string; agent: boolean }>>(null);

    const [expired, active] = useMemo(
        () => partition(tokens, (t) => getTokenStatus(t.ExpireTime) === 'expired'),
        [tokens]
    );

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
            {c('Action').t`New token`}
        </Button>
    );

    const renderTokenCard = (token: PersonalAccessToken) => (
        <AccessTokenCard
            key={token.PersonalAccessTokenID}
            token={token}
            onDelete={(t) => setAction({ type: 'delete', token: t })}
            onManageAccess={(t) => setAction({ type: 'manage-access', token: t })}
            onViewActions={(t) => setAction({ type: 'view-actions', token: t })}
        />
    );

    const renderContent = () => {
        if (!list.loading && tokens.length === 0) {
            return (
                <div className="flex flex-column items-center text-center py-2 gap-2">
                    <strong>{c('Title').t`No access tokens yet`}</strong>
                    <span className="color-weak text-sm">
                        {c('Info').t`Create a token to integrate ${PASS_APP_NAME} with your scripts and tools.`}
                    </span>
                    <div className="mt-2">{createNewTokenBtn}</div>
                </div>
            );
        }

        return (
            <div className="flex flex-column gap-2">
                {active.map(renderTokenCard)}
                {createNewTokenBtn}
                {expired.length > 0 && (
                    <CollapsibleSection className="mt-3" label={c('Label').t`Expired tokens (${expired.length})`}>
                        <div className="color-weak text-sm mb-4">{c('Info')
                            .t`Only tokens that expired in the last 30 days are shown. Older tokens are automatically deleted.`}</div>
                        <div className="flex flex-column gap-2">{expired.map(renderTokenCard)}</div>
                    </CollapsibleSection>
                )}
            </div>
        );
    };

    const renderAction = () => {
        switch (action?.type) {
            case 'create':
                return <CreateTokenModal onClose={() => setAction(null)} onCreated={handleCreated} />;
            case 'manage-access':
                return <ManageAccessModal token={action.token} onClose={() => setAction(null)} />;
            case 'view-actions':
                return <ViewActionsModal token={action.token} onClose={() => setAction(null)} />;
            case 'delete':
                return (
                    <ConfirmationPrompt
                        danger
                        title={c('Title').t`Delete access token?`}
                        message={
                            <span className="text-break">
                                {getTokenStatus(action.token.ExpireTime) === 'expired'
                                    ? c('Info')
                                          .t`Access token "${action.token.Name}" is already expired. If deleted, it will no longer be shown.`
                                    : c('Info')
                                          .t`Access token "${action.token.Name}" will stop working immediately. This action cannot be undone.`}
                            </span>
                        }
                        confirmText={c('Action').t`Delete`}
                        loading={remove.loading}
                        onCancel={() => setAction(null)}
                        onConfirm={handleDelete}
                    />
                );
        }
    };

    return (
        <>
            {renderContent()}
            {renderAction()}
            {reveal && <TokenRevealModal envVar={reveal.envVar} agent={reveal.agent} onClose={() => setReveal(null)} />}
        </>
    );
};

const AccessTokensUpgrade: FC = () => (
    <div className="flex flex-column items-center text-center py-2 gap-3">
        <strong>{c('Title').t`Access tokens require ${PASS_APP_NAME} Plus`}</strong>
        <span className="color-weak text-sm max-w-custom" style={{ '--max-w-custom': '28rem' }}>
            {c('Info')
                .t`Upgrade to ${PASS_APP_NAME} Plus to create access tokens and use ${PASS_APP_NAME} programmatically.`}
        </span>
        <UpgradeButton upsellRef={UpsellRef.PAT} />
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
                    <IcKey size={3.5} /> {c('Label').t`Access tokens`}
                </span>
            }
            subTitle={
                <span className="block mt-2">
                    {c('Info')
                        .jt`Access tokens, used together with ${passCliLink}, allow you to automate CI/CD or give your AI agent scoped access to what it needs to run its job.`}
                </span>
            }
        >
            {!hasAccess ? <AccessTokensUpgrade /> : <AccessTokensList />}
        </SettingsPanel>
    );
};
