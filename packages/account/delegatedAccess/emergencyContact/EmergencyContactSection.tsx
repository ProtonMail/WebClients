import { c } from 'ttag';

import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
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
        <DashboardGrid>
            <DashboardGridSectionHeader title={c('Title').t`Emergency access`} />
            <div>
                <OutgoingDelegatedAccessProvider>
                    <OutgoingEmergencyContactUpsell app={app} />
                    <OutgoingDelegatedAccessActions />
                    <OutgoingEmergencyContactSearchParams />
                    <OutgoingEmergencyContactSettings />
                </OutgoingDelegatedAccessProvider>
            </div>
            <div>
                <IncomingDelegatedAccessProvider>
                    <IncomingDelegatedAccessActions app={app} />
                    <IncomingEmergencyContactSettings hideEmptyIncomingHelpText={false} />
                </IncomingDelegatedAccessProvider>
            </div>
        </DashboardGrid>
    );
};
