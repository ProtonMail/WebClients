import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';

import { DriveStepModal } from './DriveStepModal';
import { TransferDestinationErrorIllustration } from './illustrations/TransferDestinationErrorIllustration';

interface Props {
    onClose: () => void;
}

export const DriveImportPausedStep = ({ onClose }: Props) => {
    const settingsLink = useSettingsLink();

    const handleUpgrade = () => {
        onClose();
        settingsLink('/upgrade');
    };

    const easySwitchSettingsLink = (
        <SettingsLink key="easy-switch-settings" path="/easy-switch" onClick={onClose}>
            {c('Link').t`settings`}
        </SettingsLink>
    );

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
