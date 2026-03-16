import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { IncomingRecoveryContactParams } from '@proton/account/delegatedAccess/recoveryContact/incoming/IncomingRecoveryContactParams';
import { IncomingRecoveryContactSettings } from '@proton/account/delegatedAccess/recoveryContact/incoming/IncomingRecoveryContactSettings';
import { OutgoingRecoveryContactParams } from '@proton/account/delegatedAccess/recoveryContact/outgoing/OutgoingRecoveryContactParams';
import { OutgoingRecoveryContactSettings } from '@proton/account/delegatedAccess/recoveryContact/outgoing/OutgoingRecoveryContactSettings';
import { IncomingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-contacts.svg';

export const RecoveryContactSubpage = ({ app, emailSubpagePath }: { app: APP_NAMES; emailSubpagePath: string }) => {
    const [userSettings] = useUserSettings();

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

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
            {userHasNoAccountRecoveryMethodSet && (
                <div className="mb-4">
                    <Banner
                        variant="info-outline"
                        action={
                            <ButtonLike as={Link} to={emailSubpagePath}>{c('emergency_access')
                                .t`Set account recovery`}</ButtonLike>
                        }
                    >
                        {c('emergency_access')
                            .t`To add and use recovery contact, you must have a password reset option.`}
                    </Banner>
                </div>
            )}

            <OutgoingDelegatedAccessProvider>
                <OutgoingDelegatedAccessActions />
                <OutgoingRecoveryContactParams />
                <OutgoingRecoveryContactSettings
                    userHasNoAccountRecoveryMethodSet={userHasNoAccountRecoveryMethodSet}
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
