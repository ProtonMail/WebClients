import Icon from '@proton/components/components/icon/Icon';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';

import type { PlanConfigStorage } from './interface';

const ReminderSectionStorage = ({ title, description, warning }: PlanConfigStorage) => {
    return (
        <SettingsSection className="container-section-sticky-section mb-0">
            <SettingsSectionTitle>{title}</SettingsSectionTitle>
            <SettingsParagraph className="mb-6">{description}</SettingsParagraph>
            <SettingsParagraph className="mb-6">
                <div
                    className="rounded p-2 flex flex-nowrap gap-2"
                    style={{ backgroundColor: 'var(--signal-danger-minor-1)' }}
                >
                    <Icon name="exclamation-circle-filled" className="shrink-0 mt-0.5 color-danger" />
                    <span className="flex-1">{warning}</span>
                </div>
            </SettingsParagraph>
        </SettingsSection>
    );
};

export default ReminderSectionStorage;
