import { c } from 'ttag';

import { IncomingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription from '@proton/components/containers/account/SettingsDescription';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { IncomingEmergencyContactSettings } from '@proton/delegated-access/emergencyContact/incoming/IncomingEmergencyContactSettings';
import { OutgoingEmergencyContactSearchParams } from '@proton/delegated-access/emergencyContact/outgoing/OutgoingEmergencyAccessParams';
import { OutgoingEmergencyContactSettings } from '@proton/delegated-access/emergencyContact/outgoing/OutgoingEmergencyContactSettings';
import { OutgoingEmergencyContactUpsell } from '@proton/delegated-access/emergencyContact/outgoing/OutgoingEmergencyContactUpsell';
import { IncomingDelegatedAccessActions } from '@proton/delegated-access/shared/IncomingDelegatedAccessActions';
import { OutgoingDelegatedAccessActions } from '@proton/delegated-access/shared/OutgoingDelegatedAccessActions';
import { PaymentsContextProvider } from '@proton/payments-ui/ui/context/PaymentContext';
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import darkIllustration from './assets/recovery-emergency-contacts-dark.svg';
import illustration from './assets/recovery-emergency-contacts.svg';

export const EmergencyContactSubpage = ({ app }: { app: APP_NAMES }) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    return (
        <DashboardGrid>
            <SettingsDescription
                right={
                    <img
                        src={isDarkTheme ? darkIllustration : illustration}
                        alt=""
                        className="shrink-0 hidden md:block"
                        width={80}
                        height={80}
                    />
                }
            >
                <SettingsDescription.Item>
                    {c('Info')
                        .t`Add 1 to 5 people who you trust and can contact easily. They will be able to reset your password for you by signing in to your account. They must already have a ${BRAND_NAME} Account.`}{' '}
                    <Href key="learn" href={getKnowledgeBaseUrl('/emergency-access')}>{c('Link').t`Learn more`}</Href>
                </SettingsDescription.Item>
            </SettingsDescription>

            <PaymentsContextProvider>
                <OutgoingDelegatedAccessProvider>
                    <OutgoingEmergencyContactUpsell app={app} />
                    <OutgoingDelegatedAccessActions />
                    <OutgoingEmergencyContactSearchParams />
                    <OutgoingEmergencyContactSettings />
                </OutgoingDelegatedAccessProvider>
            </PaymentsContextProvider>
            <IncomingDelegatedAccessProvider>
                <IncomingDelegatedAccessActions app={app} />
                <IncomingEmergencyContactSettings hideEmptyIncomingHelpText={true} />
            </IncomingDelegatedAccessProvider>
        </DashboardGrid>
    );
};
