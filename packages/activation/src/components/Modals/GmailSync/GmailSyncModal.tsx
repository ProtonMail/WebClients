import { useEffect } from 'react';

import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { ImportProvider, OAuthProps } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button';
import { ModalTwo, useModalState } from '@proton/components/index';

import GmailSyncModalAnimation from './GmailSyncModalAnimation';
import SignInWithGoogle from './SignInWithGoogle';

interface Props {
    syncOpen: boolean;
    onSyncCallback?: (hasError: boolean) => void;
    onSyncSkipCallback?: () => void;
}

const GmailSyncModal = ({ syncOpen, onSyncCallback, onSyncSkipCallback }: Props) => {
    const [syncModalProps, setSyncModalProps, renderSyncModal] = useModalState();

    useEffect(() => {
        setSyncModalProps(syncOpen);
    }, [syncOpen]);

    const dispatch = useEasySwitchDispatch();
    const syncState = useEasySwitchSelector(selectCreateSyncState);
    const loading = syncState === 'pending';

    const { triggerOAuthPopup } = useOAuthPopup({
        errorMessage: c('loc_nightly:Error').t`Your sync will not be processed.`,
    });

    const handleGoogleSync = () => {
        triggerOAuthPopup({
            provider: ImportProvider.GOOGLE,
            scope: SYNC_G_OAUTH_SCOPES.join(' '),
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;
                dispatch(changeCreateLoadingState('pending'));
                const res = await dispatch(
                    createSyncItem({
                        Code,
                        Provider,
                        RedirectUri,
                        Source: SYNC_SOURCE,
                        notification: SYNC_SUCCESS_NOTIFICATION,
                    })
                );

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    syncModalProps.onClose();
                }
                onSyncCallback?.(hasError);
            },
        });
    };

    const handleSyncSkip = () => {
        onSyncSkipCallback?.();
        syncModalProps.onClose();
    };

    return (
        <>
            {renderSyncModal && (
                <ModalTwo size="xlarge" fullscreenOnMobile {...syncModalProps}>
                    <section className="flex flex-row m2 h100 flex-gap-2">
                        <div className="flex flex-column flex-nowrap flex-gap-2">
                            <div style={{ color: '#372580' }}>
                                <h1>{c('Gmail forwarding').t`Automatically forward`}</h1>
                                <br className="no-desktop" />
                                <h2>{c('Gmail forwarding').t`Gmail messages to your inbox`}</h2>
                            </div>
                            <div className="no-desktop flex-item-grow-2">
                                <GmailSyncModalAnimation />
                            </div>
                            <div className="flex flex-column flex-align-items-center flex-gap-1">
                                <SignInWithGoogle onClick={handleGoogleSync} loading={loading} />
                                <Button shape="ghost" color="norm" onClick={handleSyncSkip}>{c('Action')
                                    .t`Skip`}</Button>
                            </div>
                        </div>
                        <div className="no-tablet flex-item-grow-2">
                            <GmailSyncModalAnimation />
                        </div>
                    </section>
                </ModalTwo>
            )}
        </>
    );
};

export default GmailSyncModal;
