import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useUser } from '@proton/components/index';

import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE, SYNC_SUCCESS_NOTIFICATION } from '../../constants';
import useOAuthPopup from '../../hooks/useOAuthPopup';
import { ImportProvider, OAuthProps } from '../../interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../logic/store';
import { changeCreateLoadingState, createSyncItem } from '../../logic/sync/sync.actions';
import { selectCreateSyncState } from '../../logic/sync/sync.selectors';
import GmailSyncModal from '../Modals/GmailSync/GmailSyncModal';
import ProviderCard from './ProviderCards/ProviderCard';

const GmailForwarding = () => {
    const dispatch = useEasySwitchDispatch();
    const loadingState = useEasySwitchSelector(selectCreateSyncState);
    const isLoading = loadingState === 'pending';
    const [displayModal, setDisplayModal] = useState(false);

    const [user, loadingUser] = useUser();
    const disabled = loadingUser || !user.hasNonDelinquentScope;

    const { triggerOAuthPopup } = useOAuthPopup({
        errorMessage: c('Error').t`Your forward will not be processed.`,
    });

    const handleSynchronizeClick = () => {
        triggerOAuthPopup({
            provider: ImportProvider.GOOGLE,
            scope: SYNC_G_OAUTH_SCOPES.join(' '),
            callback: async (oAuthProps: OAuthProps) => {
                dispatch(changeCreateLoadingState('pending'));
                const { Code, Provider, RedirectUri } = oAuthProps;
                await dispatch(
                    createSyncItem({
                        Code,
                        Provider,
                        RedirectUri,
                        Source: SYNC_SOURCE,
                        notification: SYNC_SUCCESS_NOTIFICATION,
                    })
                );
            },
        });
    };

    return (
        <>
            <div className="mb2">
                <Button onClick={() => setDisplayModal(!displayModal)}>Display onboarding modal</Button>
            </div>
            <ProviderCard
                loading={isLoading}
                provider={ImportProvider.GOOGLE}
                onClick={handleSynchronizeClick}
                disabled={disabled}
                className="mb1 mr1"
                data-testid="ProviderCard:googleCardForward"
            />
            <GmailSyncModal syncOpen={displayModal} onSyncCallback={() => {}} />
        </>
    );
};

export default GmailForwarding;
