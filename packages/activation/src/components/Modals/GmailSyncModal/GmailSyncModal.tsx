import { c } from 'ttag';

import AddBYOEModal from '@proton/activation/src/components/Modals/AddBYOEModal/AddBYOEModal';
import { BYOE_FAIL_NOTIFICATION, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EASY_SWITCH_SOURCES, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import GmailSyncModalAnimation from './GmailSyncModalAnimation';
import SignInWithGoogle from './SignInWithGoogle';

interface Props extends ModalProps {
    source: EASY_SWITCH_SOURCES;
    reduceHeight?: boolean;
    onSyncCallback?: (hasError: boolean, sync?: Sync) => void;
    onSyncSkipCallback?: () => void;
    noSkip?: boolean;
    hasAccessToBYOE?: boolean;
}

const GmailSyncModal = ({
    onSyncCallback,
    onSyncSkipCallback,
    source,
    reduceHeight,
    noSkip,
    hasAccessToBYOE,
    ...rest
}: Props) => {
    const dispatch = useEasySwitchDispatch();
    const syncState = useEasySwitchSelector(selectCreateSyncState);
    const loading = syncState === 'pending';

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        // translators: This string is shown when something went wrong during easy switch Gmail oAuth
        errorMessage: c('Error').t`Permissions request failed.`,
    });

    const handleGoogleSync = () => {
        void triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            features: hasAccessToBYOE ? [EASY_SWITCH_FEATURES.BYOE] : [EASY_SWITCH_FEATURES.IMPORT_MAIL],
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;
                dispatch(changeCreateLoadingState('pending'));
                const res = await dispatch(
                    createSyncItem({
                        Code,
                        Provider,
                        RedirectUri,
                        Source: source,
                        successNotification: hasAccessToBYOE ? undefined : SYNC_SUCCESS_NOTIFICATION,
                        errorNotification: hasAccessToBYOE ? BYOE_FAIL_NOTIFICATION : undefined,
                    })
                );
                const payload = res.type.endsWith('fulfilled') ? res?.payload : undefined;

                const sync = payload?.sync as Sync;

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    rest?.onClose?.();
                }
                onSyncCallback?.(hasError, sync);
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

    if (hasAccessToBYOE) {
        return <AddBYOEModal {...rest} onClose={handleClose} onSubmit={handleGoogleSync} isLoading={loading} />;
    }

    return (
        <ModalTwo size={hasAccessToBYOE ? 'small' : 'xlarge'} fullscreenOnMobile {...rest} onClose={handleClose}>
            <ModalTwoHeader />
            <ModalTwoContent className="m-8 mt-0 flex flex-row items-center flex-nowrap gap-7">
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
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default GmailSyncModal;
