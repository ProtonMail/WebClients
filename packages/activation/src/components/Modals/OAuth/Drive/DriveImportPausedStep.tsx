import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useLoading from '@proton/hooks/useLoading';

import { ApiImporterError } from '../../../../api/api.interface';
import { useReconnectOAuthImport } from '../../../../hooks/useReconnectOAuthImport';
import { EASY_SWITCH_SOURCES, ImportType } from '../../../../interface';
import type { Importer } from '../../../../logic/importers/importers.interface';
import { DriveStepModal } from './DriveStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';
import { TransferSourceErrorIllustration } from './illustrations/TransferSourceErrorIllustration';

interface Props {
    importer: Importer;
    errorCode?: ApiImporterError;
    onClose: () => void;
}

export const DriveImportPausedStep = ({ importer, errorCode, onClose }: Props) => {
    const settingsLink = useSettingsLink();
    const { reconnectOAuthImport, loadingConfig } = useReconnectOAuthImport(EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR);
    const [loadingReconnect, withLoadingReconnect] = useLoading();

    const handleUpgrade = () => {
        onClose();
        settingsLink('/upgrade');
    };

    const handleReconnect = async () => {
        await withLoadingReconnect(reconnectOAuthImport(importer, ImportType.DRIVE));
        onClose();
    };

    const easySwitchSettingsLink = (
        <SettingsLink key="easy-switch-settings" path="/easy-switch" onClick={onClose}>
            {c('Link').t`settings`}
        </SettingsLink>
    );

    if (errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION) {
        return (
            <DriveStepModal
                onClose={onClose}
                media={<TransferSourceErrorIllustration />}
                secondaryAction={{ label: c('Action').t`Dismiss`, onClick: onClose }}
                primaryAction={{
                    label: c('Action').t`Reconnect`,
                    onClick: handleReconnect,
                    disabled: loadingConfig || loadingReconnect,
                }}
            >
                <h3 className="text-bold">{c('Title').t`Reconnect to finish your import`}</h3>
                <p className="color-weak mt-2 mb-0">{c('Info')
                    .t`Your import is paused because we lost access to your Google account. Reconnect to bring the rest of your files over.`}</p>
                <p className="color-weak mt-2 mb-0">
                    {c('Info').jt`You can also cancel your import in ${easySwitchSettingsLink}.`}
                </p>
            </DriveStepModal>
        );
    }

    return (
        <DriveStepModal
            onClose={onClose}
            media={<TransferDestinationErrorIllustration />}
            secondaryAction={{ label: c('Action').t`Dismiss`, onClick: onClose }}
            primaryAction={{ label: c('Action').t`Upgrade`, onClick: handleUpgrade }}
        >
            <h3 className="text-bold">{c('Title').t`More storage needed to finish your import`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Your import is blocked. Upgrade now to bring the rest of your files over.`}</p>
            <p className="color-weak mt-2 mb-0">
                {c('Info')
                    .jt`If you've already upgraded, you can resume your import in ${easySwitchSettingsLink}. You can also cancel it there.`}
            </p>
        </DriveStepModal>
    );
};
