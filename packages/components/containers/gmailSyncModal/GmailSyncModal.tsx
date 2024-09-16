import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EASY_SWITCH_SOURCES, OAuthProps } from '@proton/activation/src/interface';
import { ImportProvider } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo } from '@proton/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

import GmailSyncModalAnimation from './GmailSyncModalAnimation';
import SignInWithGoogle from './SignInWithGoogle';

interface Props extends ModalProps {
    source: EASY_SWITCH_SOURCES;
    reduceHeight?: boolean;
    onSyncCallback?: (hasError: boolean) => void;
    onSyncSkipCallback?: () => void;
    noSkip?: boolean;
}

const GmailSyncModal = ({ onSyncCallback, onSyncSkipCallback, source, reduceHeight, noSkip, ...rest }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const syncState = useEasySwitchSelector(selectCreateSyncState);
    const loading = syncState === 'pending';

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
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
                        Source: source,
                        notification: SYNC_SUCCESS_NOTIFICATION,
                    })
                );

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    rest?.onClose?.();
                }
                onSyncCallback?.(hasError);
            },
        });
    };

    const handleSyncSkip = () => {
        onSyncSkipCallback?.();
        rest?.onClose?.();
    };

    const handleClose = () => {
        onSyncSkipCallback?.();
        rest?.onClose?.();
    };

    return (
        <ModalTwo size="xlarge" fullscreenOnMobile {...rest} onClose={handleClose}>
            <ModalHeader />
            <ModalContent className="m-8 mt-0 flex flex-row items-center flex-nowrap gap-7">
                <div className="flex flex-column flex-1 gap-7">
                    <h1 className="text-break text-4xl">
                        <strong>{c('Gmail forwarding').t`Automatically forward`}</strong>
                        &nbsp;
                        <br className="lg:hidden" />
                        {c('Gmail forwarding').t`Gmail messages to your inbox`}
                    </h1>
                    <div className="lg:hidden grow-2">
                        <GmailSyncModalAnimation reduceHeight={reduceHeight} />
                    </div>
                    <div className="flex flex-column items-center gap-4">
                        <SignInWithGoogle
                            onClick={handleGoogleSync}
                            loading={loading}
                            disabled={loadingConfig}
                            fullWidth
                        />
                        {!noSkip && (
                            <Button shape="ghost" color="norm" fullWidth onClick={handleSyncSkip}>{c('Action')
                                .t`Skip`}</Button>
                        )}
                    </div>
                </div>
                <div className="hidden lg:block w-6/10">
                    <GmailSyncModalAnimation reduceHeight={reduceHeight} />
                </div>
            </ModalContent>
        </ModalTwo>
    );
};

export default GmailSyncModal;
