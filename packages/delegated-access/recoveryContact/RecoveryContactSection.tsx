import { c } from 'ttag';

import { IncomingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { selectAvailableRecoveryMethods } from '@proton/account/recovery/sessionRecoverySelectors';
import { useSelector } from '@proton/account/store/hooks';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { IncomingDelegatedAccessActions } from '../shared/IncomingDelegatedAccessActions';
import { OutgoingDelegatedAccessActions } from '../shared/OutgoingDelegatedAccessActions';
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
