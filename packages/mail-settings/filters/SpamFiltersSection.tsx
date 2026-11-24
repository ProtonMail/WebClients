import { c } from 'ttag';

import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Spams from './spams/Spams';

const getListItems = () => [
    {
        name: c('FilterSettings').t`Spam:`,
        description: c('FilterSettings').t`To prevent junk mail from clogging up your inbox`,
    },
    {
        name: c('FilterSettings').t`Block:`,
        description: c('FilterSettings').t`To stop phishing or suspicious emails from entering your email system`,
    },
    {
        name: c('FilterSettings').t`Allow:`,
        description: c('FilterSettings').t`To ensure critical messages don't end up in spam and getting missed`,
    },
];

interface Props {
    /** The lite app renders the section without cards. */
    variant?: SettingsLayoutVariant;
}

const SpamFiltersSection = ({ variant = SettingsLayoutVariant.Default }: Props) => {
    const intro = c('FilterSettings').t`Take control over what lands in your inbox by creating the following lists:`;

    if (variant === SettingsLayoutVariant.Card) {
        return (
            <DashboardGrid as="div">
                <DashboardGridSectionHeader
                    title={c('Title').t`Spam, block, and allow lists`}
                    subtitle={
                        <>
                            {intro}
                            {getListItems().map(({ name, description }) => (
                                <span key={name}>
                                    <br />
                                    <strong>{name}</strong> {description}
                                </span>
                            ))}
                            <br />
                            <Href href={getKnowledgeBaseUrl('/spam-filtering')}>{c('Link').t`Learn more`}</Href>
                        </>
                    }
                />
                <Spams variant={SettingsLayoutVariant.Card} />
            </DashboardGrid>
        );
    }

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/spam-filtering')}>
                {intro}
                <ul className="mt-2 mb-0">
                    {getListItems().map(({ name, description }) => (
                        <li key={name}>
                            <strong>{name}</strong> {description}
                        </li>
                    ))}
                </ul>
            </SettingsParagraph>
            <Spams />
        </SettingsSectionWide>
    );
};

export default SpamFiltersSection;
