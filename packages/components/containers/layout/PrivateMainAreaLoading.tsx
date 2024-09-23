import { PrivateMainArea } from '@proton/components';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';

const PrivateMainAreaLoading = () => {
    return (
        <PrivateMainArea>
            <div className="container-section-sticky">
                <SettingsPageTitle className="my-14 settings-loading-page-title" />
                <section className="container-section-sticky-section">
                    <SettingsSectionTitle className="settings-loading-section-title" />
                    <SettingsSection>
                        <SettingsParagraph className="mb-4">
                            <span className="block settings-loading-paragraph-line" />
                            <span className="block settings-loading-paragraph-line" />
                            <span className="block settings-loading-paragraph-line" />
                        </SettingsParagraph>
                    </SettingsSection>
                </section>
            </div>
        </PrivateMainArea>
    );
};
export default PrivateMainAreaLoading;
