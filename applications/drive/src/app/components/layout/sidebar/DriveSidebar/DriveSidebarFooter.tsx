import { AppVersion, getAppVersion, useConfig } from '@proton/components';

const DriveSidebarFooter = () => {
    const { APP_VERSION } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);

    // On Drive we have versioning that include last commit hash, ex. 5.1.0+58eb37d11e. We do not want to show that in sidebar
    return <AppVersion appVersion={appVersion.split('+')[0]} fullVersion={appVersion} />;
};

export default DriveSidebarFooter;
