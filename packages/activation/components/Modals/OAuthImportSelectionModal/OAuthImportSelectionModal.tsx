import { useEffect } from 'react';

import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/constants';
import useOAuthPopup from '@proton/activation/hooks/useOAuthPopup';
import { ImportProvider, ImportType, OAUTH_PROVIDER, OAuthProps } from '@proton/activation/interface';
import { startOauthDraft } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/logic/sync/sync.actions';
import { selectCreateSyncState } from '@proton/activation/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button';
import {
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
} from '@proton/components';

interface Props {
    modalProps: ModalStateProps;
    onClose: () => void;
}

/**
 * Modal temporarily used to make an internal test on Gmail emails synchronization
 */
const OAuthImportSelectionModal = ({ modalProps, onClose }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const { triggerOAuthPopup } = useOAuthPopup({
        errorMessage: c('loc_nightly:Error').t`Your sync will not be processed.`,
    });

    const loadingState = useEasySwitchSelector(selectCreateSyncState);
    const loading = loadingState === 'pending';

    useEffect(() => {
        if (loadingState === 'success') {
            modalProps.onClose();
            dispatch(changeCreateLoadingState('idle'));
        }
    }, [loadingState]);

    const handleSynchronizeClick = () => {
        triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            scope: SYNC_G_OAUTH_SCOPES.join(' '),
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;
                dispatch(changeCreateLoadingState('pending'));
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

    const handleImportClick = () => {
        dispatch(
            startOauthDraft({
                provider: ImportProvider.GOOGLE,
                products: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
            })
        );
        onClose();
    };

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('loc_nightly:account').t`What would you like to do?`} />
            <ModalTwoContent>
                {c('loc_nightly:account')
                    .t`You can either import your Gmail emails, calendars and contacts or automatically synchronize all incoming Gmail emails.`}
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column">
                <PrimaryButton onClick={handleSynchronizeClick} loading={loading}>
                    {c('loc_nightly:account').t`Sync future emails`}
                </PrimaryButton>
                <Button onClick={handleImportClick} disabled={loading}>
                    {c('loc_nightly:account').t`Import past emails, calendars and contacts`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default OAuthImportSelectionModal;
