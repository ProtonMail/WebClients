import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Spams from '../filters/spams/Spams';

const OrganizationSpamFiltersSection = () => (
    <SettingsSectionWide>
        <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/filter-lists-organization')}>
            {c('FilterSettings')
                .t`Take control over what lands in your organization members' inboxes by creating the following lists:`}
            <ul className="mt-2">
                <li>
                    <strong>{c('FilterSettings').t`Spam:`}</strong>{' '}
                    {c('FilterSettings').t`To prevent junk mail from clogging up inboxes`}
                </li>
                <li>
                    <strong>{c('FilterSettings').t`Block:`}</strong>{' '}
                    {c('FilterSettings')
                        .t`To stop phishing or suspicious emails from entering your organization's email system`}
                </li>
                <li>
                    <strong>{c('FilterSettings').t`Allow:`}</strong>{' '}
                    {c('FilterSettings').t`To ensure critical messages don't end up in spam and getting missed`}
                </li>
            </ul>
            {c('FilterSettings')
                .t`These lists apply to all accounts in your organization. Members can create their own individual filters, but won't be able to override addresses or domains you blocked.`}
        </SettingsParagraph>
        <Spams isOrganization />
    </SettingsSectionWide>
);

export default OrganizationSpamFiltersSection;
