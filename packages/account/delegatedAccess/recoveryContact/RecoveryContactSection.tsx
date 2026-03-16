import { useUserSettings } from '@proton/account/userSettings/hooks';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { IncomingDelegatedAccessActions } from '../shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '../shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '../shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '../shared/OutgoingDelegatedAccessProvider';
import { IncomingRecoveryContactParams } from './incoming/IncomingRecoveryContactParams';
import { IncomingRecoveryContactSettings } from './incoming/IncomingRecoveryContactSettings';
import { OutgoingRecoveryContactParams } from './outgoing/OutgoingRecoveryContactParams';
import { OutgoingRecoveryContactSettings } from './outgoing/OutgoingRecoveryContactSettings';

export const RecoveryContactSection = ({ app }: { app: APP_NAMES }) => {
    const [userSettings] = useUserSettings();

    const userHasNoAccountRecoveryMethodSet = Boolean(
        userSettings &&
        // If email reset is enabled and set
        !(
            (userSettings.Email.Reset && userSettings.Email.Value) ||
            // If phone reset is enabled and set
            (userSettings.Phone.Reset && userSettings.Phone.Value)
        )
    );

    return (
        <div className="pt-6">
            <SettingsSectionWide className="mb-6">
                <OutgoingDelegatedAccessProvider>
                    <OutgoingDelegatedAccessActions />
                    <OutgoingRecoveryContactParams />
                    <OutgoingRecoveryContactSettings
                        userHasNoAccountRecoveryMethodSet={userHasNoAccountRecoveryMethodSet}
                    />
                </OutgoingDelegatedAccessProvider>
            </SettingsSectionWide>
            <SettingsSectionWide>
                <IncomingDelegatedAccessProvider>
                    <IncomingDelegatedAccessActions app={app} />
                    <IncomingRecoveryContactSettings />
                    <IncomingRecoveryContactParams />
                </IncomingDelegatedAccessProvider>
            </SettingsSectionWide>
        </div>
    );
};
