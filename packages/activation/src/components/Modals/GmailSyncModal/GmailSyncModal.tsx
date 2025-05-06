import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { EASY_SWITCH_SOURCES, OAuthProps } from '@proton/activation/src/interface';
import { ImportProvider } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Banner, Button } from '@proton/atoms';
import { type ModalProps, ModalTwoFooter } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import GmailSyncModalAnimation from './GmailSyncModalAnimation';
import SignInWithGoogle from './SignInWithGoogle';

interface Props extends ModalProps {
    source: EASY_SWITCH_SOURCES;
    reduceHeight?: boolean;
    onSyncCallback?: (hasError: boolean, sync?: Sync, displayName?: string) => void;
    onSyncSkipCallback?: () => void;
    noSkip?: boolean;
    scope?: string;
    hasAccessToBYOE?: boolean;
}

const GmailSyncModal = ({
    onSyncCallback,
    onSyncSkipCallback,
    source,
    reduceHeight,
    noSkip,
    scope = SYNC_G_OAUTH_SCOPES.join(' '),
    hasAccessToBYOE,
    ...rest
}: Props) => {
    const dispatch = useEasySwitchDispatch();
    const syncState = useEasySwitchSelector(selectCreateSyncState);
    const loading = syncState === 'pending';

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('loc_nightly:Error').t`Your sync will not be processed.`,
    });

    const handleGoogleSync = () => {
        void triggerOAuthPopup({
            provider: ImportProvider.GOOGLE,
            scope,
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
                const payload = res.type.endsWith('fulfilled') ? res?.payload : undefined;

                const sync = payload?.sync as Sync;
                const displayName = payload?.displayName;

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    rest?.onClose?.();
                }
                onSyncCallback?.(hasError, sync, displayName);
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
        <ModalTwo size={hasAccessToBYOE ? 'small' : 'xlarge'} fullscreenOnMobile {...rest} onClose={handleClose}>
            {hasAccessToBYOE ? (
                <>
                    <ModalTwoHeader
                        title={c('loc_nightly: BYOE').t`Connecting your Gmail address`}
                        subline={c('loc_nightly: BYOE')
                            .t`It's simple to connect your Gmail address to ${BRAND_NAME} — and significantly more private.`}
                    />
                    <ModalTwoContent>
                        <Banner variant="warning" className="mb-4" icon={<Icon name="exclamation-triangle-filled" />}>
                            {c('loc_nightly: BYOE')
                                .t`Important: Link only work related accounts (i.e. non-personal accounts) to your employee account!`}
                        </Banner>

                        <div className="flex flex-row flex-nowrap gap-2 items-start mb-2">
                            <div className="bg-weak rounded-full flex p-2">
                                <Icon name="brand-google" className="shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-bold mt-0 mb-1">{c('loc_nightly: BYOE')
                                    .t`Allow ${BRAND_NAME} to access to your Gmail account`}</p>
                                <p className="my-1 color-weak">{c('loc_nightly: BYOE')
                                    .t`We only ask permission to access data that's strictly necessary.`}</p>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap gap-2 items-start mb-2">
                            <div className="bg-weak rounded-full flex p-2">
                                <Icon name="arrow-down-to-square" className="shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-bold mt-0 mb-1">{c('loc_nightly: BYOE')
                                    .t`Import messages and more`}</p>
                                <p className="my-1 color-weak">{c('loc_nightly: BYOE')
                                    .t`Your messages, contacts, and events will be imported so your data is synced in ${BRAND_NAME}.`}</p>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap gap-2 items-start mb-2">
                            <div className="bg-weak rounded-full flex p-2">
                                <Icon name="inbox" className="shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-bold mt-0 mb-1">{c('loc_nightly: BYOE')
                                    .t`Receive new emails automatically`}</p>
                                <p className="my-1 color-weak">{c('loc_nightly: BYOE')
                                    .t`New Gmail messages will seamlessly forward to your ${MAIL_APP_NAME} inbox.`}</p>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap gap-2 items-start mb-2">
                            <div className="bg-weak rounded-full flex p-2">
                                <Icon name="envelope-arrow-up-and-right" className="shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-bold mt-0 mb-1">{c('loc_nightly: BYOE')
                                    .t`Send emails from ${BRAND_NAME}`}</p>
                                <p className="my-1 color-weak">{c('loc_nightly: BYOE')
                                    .t`Send and manage your Gmail messages within ${MAIL_APP_NAME} apps — and leave your Gmail inbox behind.`}</p>
                            </div>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button className="w-full" disabled={loading} onClick={handleClose}>{c('Action')
                            .t`Cancel`}</Button>
                        <Button className="w-full" loading={loading} onClick={handleGoogleSync}>{c('Action')
                            .t`Next`}</Button>
                    </ModalTwoFooter>
                </>
            ) : (
                <>
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
                </>
            )}
        </ModalTwo>
    );
};

export default GmailSyncModal;
