import { c } from 'ttag';

import { IncomingEmergencyContactSettings } from '@proton/account/delegatedAccess/emergencyContact/incoming/IncomingEmergencyContactSettings';
import { OutgoingEmergencyContactSearchParams } from '@proton/account/delegatedAccess/emergencyContact/outgoing/OutgoingEmergencyAccessParams';
import { OutgoingEmergencyContactSettings } from '@proton/account/delegatedAccess/emergencyContact/outgoing/OutgoingEmergencyContactSettings';
import { OutgoingEmergencyContactUpsell } from '@proton/account/delegatedAccess/emergencyContact/outgoing/OutgoingEmergencyContactUpsell';
import { IncomingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessActions';
import { IncomingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import { OutgoingDelegatedAccessActions } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessActions';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-emergency-contacts.svg';

export const EmergencyContactSubpage = ({ app }: { app: APP_NAMES }) => {
    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <DashboardGrid>
            <SettingsDescription
                left={
                    <SettingsDescriptionItem>
                        {c('Info')
                            .t`Add 1 to 5 people who you trust and can contact easily. They will be able to reset your password for you by signing in to your account. They must already have a ${BRAND_NAME} Account.`}{' '}
                        {learnMoreLink}
                    </SettingsDescriptionItem>
                }
                right={<img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />}
            />

            <OutgoingDelegatedAccessProvider>
                <OutgoingEmergencyContactUpsell app={app} />
                <OutgoingDelegatedAccessActions />
                <OutgoingEmergencyContactSearchParams />
                <OutgoingEmergencyContactSettings />
            </OutgoingDelegatedAccessProvider>
            <IncomingDelegatedAccessProvider>
                <IncomingDelegatedAccessActions app={app} />
                <IncomingEmergencyContactSettings />
            </IncomingDelegatedAccessProvider>
        </DashboardGrid>
    );
};
