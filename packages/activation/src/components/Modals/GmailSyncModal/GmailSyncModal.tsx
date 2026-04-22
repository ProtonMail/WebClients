import { c } from 'ttag';

import AddBYOEModal from '@proton/activation/src/components/Modals/AddBYOEModal/AddBYOEModal';
import { getBYOEFailNotification, getSyncSuccessNotification } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EASY_SWITCH_SOURCES, ImportToken, OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import {
    SyncTokenStrategy,
    changeCreateLoadingState,
    createSyncItem,
    createTokenItem,
} from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import GmailSyncModalAnimation from './GmailSyncModalAnimation';
import SignInWithGoogle from './SignInWithGoogle';

interface Props extends ModalProps {
    source: EASY_SWITCH_SOURCES;
    reduceHeight?: boolean;
    onSyncCallback?: (hasError: boolean, sync?: Sync) => void;
    onSyncSkipCallback?: () => void;
    onBYOECallback?: (hasError: boolean, token?: ImportToken) => void;
    noSkip?: boolean;
    hasAccessToBYOE?: boolean;
    expectedEmailAddress?: string;
    onCloseCallback?: () => void;
    onComplete?: () => Promise<void>;
}

const GmailSyncModal = ({
    onSyncCallback,
    onSyncSkipCallback,
    onBYOECallback,
    source,
    reduceHeight,
    noSkip,
    hasAccessToBYOE,
    expectedEmailAddress,
    onCloseCallback,
    onComplete,
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
                        type: SyncTokenStrategy.create,
                        Code,
                        Provider,
                        RedirectUri,
                        Source: source,
                        successNotification: hasAccessToBYOE ? undefined : getSyncSuccessNotification(),
                        errorNotification: hasAccessToBYOE ? getBYOEFailNotification() : undefined,
                        expectedEmailAddress: expectedEmailAddress
                            ? { address: expectedEmailAddress, type: 'convertToBYOE' }
                            : undefined,
                    })
                );
                const payload = res.type.endsWith('fulfilled') ? res?.payload : undefined;

                const sync = payload?.sync as Sync;

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    rest?.onClose?.();
                    onCloseCallback?.();
                    void onComplete?.();
                }
                onSyncCallback?.(hasError, sync);
            },
        });
    };

    const handleBYOEWithImport = () => {
        void triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            features: [EASY_SWITCH_FEATURES.BYOE],
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;
                dispatch(changeCreateLoadingState('pending'));
                const res = await dispatch(
                    createTokenItem({
                        Code,
                        Provider,
                        RedirectUri,
                        Source: source,
                        errorNotification: getBYOEFailNotification(),
                    })
                );
                const payload = res.type.endsWith('fulfilled') ? res?.payload : undefined;

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    rest?.onClose?.();
                    onCloseCallback?.();
                }
                onBYOECallback?.(hasError, payload);
            },
        });
    };

    const handleSyncSkip = () => {
        onSyncSkipCallback?.();
        rest?.onClose?.();
        onCloseCallback?.();
    };

    const handleClose = () => {
        onSyncSkipCallback?.();
        rest?.onClose?.();
        onCloseCallback?.();
    };

    if (hasAccessToBYOE) {
        return (
            <AddBYOEModal
                {...rest}
                onClose={handleClose}
                onSubmit={handleBYOEWithImport}
                expectedEmailAddress={expectedEmailAddress}
                isLoading={loading}
            />
        );
    }

    return (
        <ModalTwo
            size="xlarge"
            fullscreenOnMobile
            {...rest}
            onClose={handleClose}
            data-testid="EasySwitch:AddForwardingModal"
        >
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
