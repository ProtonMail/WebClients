import { SettingsParagraph, SettingsSectionWide } from '@proton/components';
import AddMoreScribeSeat from '@proton/components/containers/organization/scribe/AddMoreScribeSeat';
import UserAccessToggle from '@proton/components/containers/organization/scribe/UserAccessToggle';
import { getScribeUpsellText } from '@proton/components/containers/payments/subscription/assistant/helpers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { OrganizationWithSettings } from '@proton/shared/lib/interfaces';

interface Props {
    organization?: OrganizationWithSettings;
}

const OrganizationScribeSection = ({ organization }: Props) => {
    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}>
                {getScribeUpsellText()}
            </SettingsParagraph>

            <UserAccessToggle organization={organization} />

            <AddMoreScribeSeat />
        </SettingsSectionWide>
    );
};

export default OrganizationScribeSection;
