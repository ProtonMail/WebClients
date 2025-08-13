import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { IncomingControllerProvider } from './incoming/IncomingController';
import { IncomingEmergencyAccessSection } from './incoming/IncomingEmergencyAccessSection';
import { OutgoingControllerProvider } from './outgoing/OutgoingController';
import { OutgoingEmergencyAccessSection } from './outgoing/OutgoingEmergencyAccessSection';

export const EmergencyAccessSection = ({ app }: { app: APP_NAMES }) => {
    return (
        <div className="pt-6">
            <SettingsSectionWide className="mb-6">
                <OutgoingControllerProvider app={app}>
                    <OutgoingEmergencyAccessSection />
                </OutgoingControllerProvider>
            </SettingsSectionWide>
            <SettingsSectionWide>
                <IncomingControllerProvider app={app}>
                    <IncomingEmergencyAccessSection />
                </IncomingControllerProvider>
            </SettingsSectionWide>
        </div>
    );
};
