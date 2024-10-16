import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import type { PlanConfigFeatures } from './interface';

const ReminderSectionFeatures = ({ title, features, description }: PlanConfigFeatures) => {
    return (
        <SettingsSection className="container-section-sticky-section">
            <SettingsSectionTitle className="mb-4">{title}</SettingsSectionTitle>
            <SettingsParagraph className="mb-6">{description}</SettingsParagraph>
            <section>
                <StripedList className="my-0" alternate="odd">
                    {features.map(({ icon, text }) => (
                        <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                            {text}
                        </StripedItem>
                    ))}
                </StripedList>
            </section>
            <Href className="block mt-3" href={getStaticURL('/support')}>{c('Subscription reminder')
                .t`Have a question?`}</Href>
        </SettingsSection>
    );
};

export default ReminderSectionFeatures;
