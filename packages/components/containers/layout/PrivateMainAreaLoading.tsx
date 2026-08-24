import SettingsPageTitle from '../account/SettingsPageTitle';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';
import SettingsSectionTitle from '../account/SettingsSectionTitle';
import PrivateMainArea from './PrivateMainArea';

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
