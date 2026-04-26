import { c } from 'ttag';

import { IncomingRecoveryContactParams } from '@proton/account/delegatedAccess/recoveryContact/incoming/IncomingRecoveryContactParams';
import { IncomingRecoveryContactSettings } from '@proton/account/delegatedAccess/recoveryContact/incoming/IncomingRecoveryContactSettings';
import { OutgoingRecoveryContactParams } from '@proton/account/delegatedAccess/recoveryContact/outgoing/OutgoingRecoveryContactParams';
import { OutgoingRecoveryContactSettings } from '@proton/account/delegatedAccess/recoveryContact/outgoing/OutgoingRecoveryContactSettings';
import { IncomingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { selectAvailableRecoveryMethods } from '@proton/account/recovery/sessionRecoverySelectors';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-contacts.svg';
import PasswordResetOptionRequiredWarning from './shared/PasswordResetOptionRequiredWarning';

export const RecoveryContactSubpage = ({ app, emailSubpagePath }: { app: APP_NAMES; emailSubpagePath: string }) => {
    const { hasAccountRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);
    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;
    return (
        <DashboardGrid>
            <SettingsDescription
                left={
                    <SettingsDescriptionItem>
                        {c('Info')
                            .t`By adding people you trust as recovery contacts, we'll be able to send them an email to help you if you're having trouble recovering your data after a password reset. You can also be a recovery contact for others.`}{' '}
                        {learnMoreLink}
                    </SettingsDescriptionItem>
                }
                right={<img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />}
            />
            <OutgoingDelegatedAccessProvider>
                <OutgoingDelegatedAccessActions />
                <OutgoingRecoveryContactParams />
                <OutgoingRecoveryContactSettings
                    userHasNoAccountRecoveryMethodSet={!hasAccountRecoveryMethod}
                    passwordResetOptionRequiredWarning={
                        <PasswordResetOptionRequiredWarning emailSubpagePath={emailSubpagePath} />
                    }
                />
            </OutgoingDelegatedAccessProvider>
            <IncomingDelegatedAccessProvider>
                <IncomingDelegatedAccessActions app={app} />
                <IncomingRecoveryContactSettings />
                <IncomingRecoveryContactParams />
            </IncomingDelegatedAccessProvider>
        </DashboardGrid>
    );
};
