import { Icon, StripedItem, StripedList } from '@proton/components/components';
import { SettingsSection, SettingsSectionTitle } from '@proton/components/containers/account';

import { PlanConfigFeatures } from './interface';

const ReminderSectionFeatures = ({ title, features }: PlanConfigFeatures) => {
    return (
        <SettingsSection className="container-section-sticky-section">
            <SettingsSectionTitle>{title}</SettingsSectionTitle>
            <StripedList className="lg:w-2/3" alternate="odd">
                {features.map(({ icon, text }) => (
                    <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                        {text}
                    </StripedItem>
                ))}
            </StripedList>
        </SettingsSection>
    );
};

export default ReminderSectionFeatures;
