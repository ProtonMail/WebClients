import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Spams from './spams/Spams';

const SpamFiltersSection = () => (
    <SettingsSectionWide>
        <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/spam-filtering')}>
            {c('FilterSettings').t`Take control over what lands in your inbox by creating the following lists:`}
            <ul className="mt-2 mb-0">
                <li>
                    <strong>{c('FilterSettings').t`Spam:`}</strong>{' '}
                    {c('FilterSettings').t`To prevent junk mail from clogging up your inbox`}
                </li>
                <li>
                    <strong>{c('FilterSettings').t`Block:`}</strong>{' '}
                    {c('FilterSettings').t`To stop phishing or suspicious emails from entering your email system`}
                </li>
                <li>
                    <strong>{c('FilterSettings').t`Allow:`}</strong>{' '}
                    {c('FilterSettings').t`To ensure critical messages don't end up in spam and getting missed`}
                </li>
            </ul>
        </SettingsParagraph>
        <Spams />
    </SettingsSectionWide>
);

export default SpamFiltersSection;
