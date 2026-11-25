import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useOptionalSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import useLoading from '@proton/hooks/useLoading';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { ApiImporterError } from '../../../../api/api.interface';
import { useReconnectOAuthImport } from '../../../../hooks/useReconnectOAuthImport';
import { EASY_SWITCH_SOURCES, ImportType } from '../../../../interface';
import type { Importer } from '../../../../logic/importers/importers.interface';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';
import { TransferSourceErrorIllustration } from './illustrations/TransferSourceErrorIllustration';

interface Props {
    importer: Importer;
    errorCode?: ApiImporterError;
    onClose: () => void;
}

export const DriveImportPausedStep = ({ importer, errorCode, onClose }: Props) => {
    const settingsLink = useSettingsLink();
    const openSubscriptionModal = useOptionalSubscriptionModalRaw();
    const { reconnectOAuthImport, loadingConfig } = useReconnectOAuthImport(EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR);
    const [loadingReconnect, withLoadingReconnect] = useLoading();

    const handleUpgrade = () => {
        onClose();
        if (openSubscriptionModal) {
            void openSubscriptionModal({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
            return;
        }
        settingsLink('/upgrade');
    };

    const handleReconnect = async () => {
        await withLoadingReconnect(reconnectOAuthImport(importer, ImportType.DRIVE));
        onClose();
    };

    // Resume and cancel are only available in the Easy Switch settings for now, not in Drive
    const getSettingsLink = (label: string) => (
        <SettingsLink key="easy-switch-settings" path="/easy-switch" onClick={onClose}>
            {label}
        </SettingsLink>
    );

    const resumeSettingsLink = getSettingsLink(c('Link').t`Resume or cancel your import in settings`);

    if (errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION) {
        return (
            <EasySwitchStepModal
                onClose={onClose}
                media={<TransferSourceErrorIllustration />}
                primaryAction={{
                    label: c('Action').t`Reconnect`,
                    onClick: handleReconnect,
                    disabled: loadingConfig || loadingReconnect,
                }}
                title={c('Title').t`Your import was interrupted`}
            >
                <p className="color-weak m-0">{c('Info')
                    .t`${BRAND_NAME} lost access to your Google Drive. Reconnect to continue the import.`}</p>
                <p className="mt-2 mb-0">{getSettingsLink(c('Link').t`Cancel your import in settings`)}</p>
            </EasySwitchStepModal>
        );
    }

    return (
        <EasySwitchStepModal
            onClose={onClose}
            media={<TransferDestinationErrorIllustration />}
            secondaryAction={{ label: c('Action').t`Maybe later`, onClick: onClose }}
            primaryAction={{ label: c('Action').t`Upgrade`, onClick: handleUpgrade }}
            title={c('Title').t`More storage needed to finish your import`}
        >
            <p className="color-weak m-0">{c('Info')
                .t`Your import is paused. Upgrade now to bring the rest of your files over.`}</p>
            <p className="color-weak mt-2 mb-0">
                {
                    // translator: full sentence "Already upgraded? Resume or cancel your import in settings"
                    c('Info').jt`Already upgraded? ${resumeSettingsLink}`
                }
            </p>
        </EasySwitchStepModal>
    );
};
