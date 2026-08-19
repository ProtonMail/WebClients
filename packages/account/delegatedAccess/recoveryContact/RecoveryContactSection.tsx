import { c } from 'ttag';

import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { selectAvailableRecoveryMethods } from '../../recovery/sessionRecoverySelectors';
import { IncomingDelegatedAccessActions } from '../shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '../shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '../shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '../shared/OutgoingDelegatedAccessProvider';
import { IncomingRecoveryContactParams } from './incoming/IncomingRecoveryContactParams';
import { IncomingRecoveryContactSettings } from './incoming/IncomingRecoveryContactSettings';
import { OutgoingRecoveryContactParams } from './outgoing/OutgoingRecoveryContactParams';
import { OutgoingRecoveryContactSettings } from './outgoing/OutgoingRecoveryContactSettings';

export const RecoveryContactSection = ({ app }: { app: APP_NAMES }) => {
    const { hasAccountRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader title={c('emergency_access').t`Data recovery contacts`} />
            <OutgoingDelegatedAccessProvider>
                <OutgoingDelegatedAccessActions />
                <OutgoingRecoveryContactParams />
                <OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={!hasAccountRecoveryMethod} />
            </OutgoingDelegatedAccessProvider>
            <IncomingDelegatedAccessProvider>
                <IncomingDelegatedAccessActions app={app} />
                <IncomingRecoveryContactSettings hideEmptyIncomingHelpText={false} />
                <IncomingRecoveryContactParams />
            </IncomingDelegatedAccessProvider>
        </DashboardGrid>
    );
};
