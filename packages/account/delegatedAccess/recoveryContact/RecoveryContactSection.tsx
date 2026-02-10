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

export const RecoveryContactSection = ({
    app,
    accountRecoveryId,
}: {
    app: APP_NAMES;
    accountRecoveryId: string | null;
}) => {
    return (
        <div className="pt-6">
            <SettingsSectionWide className="mb-6">
                <OutgoingDelegatedAccessProvider>
                    <OutgoingDelegatedAccessActions />
                    <OutgoingRecoveryContactParams />
                    <OutgoingRecoveryContactSettings accountRecoveryId={accountRecoveryId} />
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
