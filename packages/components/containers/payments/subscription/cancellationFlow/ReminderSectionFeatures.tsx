import { StripedItem, StripedList } from '@proton/components';
import { Icon } from '@proton/components/components';
import { SettingsParagraph, SettingsSection, SettingsSectionTitle } from '@proton/components/containers/account';

import type { PlanConfigFeatures } from './interface';

const ReminderSectionFeatures = ({ title, features, description, extraWarning }: PlanConfigFeatures) => {
    return (
        <SettingsSection className="container-section-sticky-section">
            <SettingsSectionTitle>{title}</SettingsSectionTitle>
            <SettingsParagraph>{description}</SettingsParagraph>
            <section className="border rounded-lg p-4">
                <StripedList className="my-0" alternate="odd">
                    {features.map(({ icon, text }) => (
                        <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                            {text}
                        </StripedItem>
                    ))}
                </StripedList>
            </section>
            {extraWarning && (
                <SettingsParagraph className="mt-6">
                    <div
                        className="rounded p-2 flex flex-nowrap gap-2"
                        style={{ backgroundColor: 'var(--signal-danger-minor-1)' }}
                    >
                        <Icon name="exclamation-circle-filled" className="shrink-0 mt-0.5 color-danger" />
                        <span className="flex-1">{extraWarning}</span>
                    </div>
                </SettingsParagraph>
            )}
        </SettingsSection>
    );
};

export default ReminderSectionFeatures;
