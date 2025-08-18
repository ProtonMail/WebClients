import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { IncomingControllerProvider } from './incoming/IncomingController';
import { IncomingEmergencyAccessSection } from './incoming/IncomingEmergencyAccessSection';

export const NonPrivateEmergencyAccessSection = ({ app }: { app: APP_NAMES }) => {
    return (
        <SettingsSectionWide>
            <IncomingControllerProvider app={app}>
                <IncomingEmergencyAccessSection />
            </IncomingControllerProvider>
        </SettingsSectionWide>
    );
};
