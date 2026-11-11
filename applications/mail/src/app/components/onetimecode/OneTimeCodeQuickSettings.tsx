import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { useOneTimeCodeSettings } from './useOneTimeCodeSettings';

const OneTimeCodeQuickSettings = () => {
    const isOneTimePasscodeEnabled = useFlag(MailFeatureFlag.OneTimePasscode);
    const { detectionEnabled, setDetectionEnabled, moveToTrashEnabled, setMoveToTrashEnabled } =
        useOneTimeCodeSettings();
    const { createNotification } = useNotifications();

    if (!isOneTimePasscodeEnabled) {
        return null;
    }

    return (
        <DrawerAppSection>
            <QuickSettingsSectionRow
                label={c('Label').t`One-time codes`}
                labelInfo={<Info title={c('Info').t`Copy one-time codes from recent emails in one click`} />}
                labelProps={{ htmlFor: 'toggle-one-time-codes' }}
                action={
                    <Toggle
                        id="toggle-one-time-codes"
                        checked={detectionEnabled}
                        onChange={({ target }) => {
                            const next = target.checked;
                            setDetectionEnabled(next);
                            createNotification({
                                text: next
                                    ? c('Success').t`One-time codes enabled`
                                    : c('Success').t`One-time codes disabled`,
                            });
                        }}
                        data-testid="mail-quick-settings:one-time-codes-toggle"
                    />
                }
            />
            {detectionEnabled && (
                <QuickSettingsSectionRow
                    label={c('Label').t`Move to Trash`}
                    labelInfo={<Info title={c('Info').t`Move one-time code emails to Trash on copy`} />}
                    labelProps={{ htmlFor: 'toggle-one-time-code-move-to-trash' }}
                    action={
                        <Toggle
                            id="toggle-one-time-code-move-to-trash"
                            checked={moveToTrashEnabled}
                            onChange={({ target }) => {
                                setMoveToTrashEnabled(target.checked);
                                createNotification({ text: c('Success').t`Preference saved` });
                            }}
                            data-testid="mail-quick-settings:one-time-code-move-to-trash-toggle"
                        />
                    }
                />
            )}
        </DrawerAppSection>
    );
};

export default OneTimeCodeQuickSettings;
