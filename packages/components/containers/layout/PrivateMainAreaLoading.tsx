import {
    PrivateMainArea,
    SettingsPageTitle,
    SettingsParagraph,
    SettingsSection,
    SettingsSectionTitle,
} from '@proton/components';

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
