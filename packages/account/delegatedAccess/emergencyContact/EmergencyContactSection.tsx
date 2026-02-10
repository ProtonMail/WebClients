import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { IncomingDelegatedAccessActions } from '../shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '../shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '../shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '../shared/OutgoingDelegatedAccessProvider';
import { IncomingEmergencyContactSettings } from './incoming/IncomingEmergencyContactSettings';
import { OutgoingEmergencyContactSearchParams } from './outgoing/OutgoingEmergencyAccessParams';
import { OutgoingEmergencyContactSettings } from './outgoing/OutgoingEmergencyContactSettings';
import { OutgoingEmergencyContactUpsell } from './outgoing/OutgoingEmergencyContactUpsell';

export const EmergencyContactSection = ({ app }: { app: APP_NAMES }) => {
    return (
        <div className="pt-6">
            <SettingsSectionWide className="mb-6">
                <OutgoingDelegatedAccessProvider>
                    <OutgoingEmergencyContactUpsell app={app} />
                    <OutgoingDelegatedAccessActions />
                    <OutgoingEmergencyContactSearchParams />
                    <OutgoingEmergencyContactSettings />
                </OutgoingDelegatedAccessProvider>
            </SettingsSectionWide>
            <SettingsSectionWide>
                <IncomingDelegatedAccessProvider>
                    <IncomingDelegatedAccessActions app={app} />
                    <IncomingEmergencyContactSettings />
                </IncomingDelegatedAccessProvider>
            </SettingsSectionWide>
        </div>
    );
};
