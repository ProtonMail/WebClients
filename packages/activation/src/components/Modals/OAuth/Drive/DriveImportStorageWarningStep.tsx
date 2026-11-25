import { c } from 'ttag';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useOptionalSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';

export const DriveImportStorageWarningStep = () => {
    const dispatch = useEasySwitchDispatch();
    const settingsLink = useSettingsLink();
    const openSubscriptionModal = useOptionalSubscriptionModalRaw();

    const handleIgnore = () => {
        dispatch(resetOauthDraft());
    };

    const handleUpgrade = () => {
        dispatch(resetOauthDraft());
        if (openSubscriptionModal) {
            void openSubscriptionModal({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
            return;
        }
        settingsLink('/upgrade');
    };

    return (
        <EasySwitchStepModal
            onClose={handleIgnore}
            media={<TransferDestinationErrorIllustration />}
            secondaryAction={{ label: c('Action').t`Maybe later`, onClick: handleIgnore }}
            primaryAction={{ label: c('Action').t`Upgrade`, onClick: handleUpgrade }}
            title={c('Title').t`More storage needed to finish your import`}
        >
            <p className="color-weak m-0">{c('Info')
                .t`Your import has started, but it will pause when your storage is full. Upgrade now to bring all your files over.`}</p>
        </EasySwitchStepModal>
    );
};
