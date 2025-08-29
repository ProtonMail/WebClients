import { AppVersion, getAppVersion, useConfig } from '@proton/components';

export const DriveSidebarFooter = () => {
    const { APP_VERSION } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);

    // On Drive we have versioning that include last commit hash, ex. 5.1.0+5c63bddc. We do not want to show that in sidebar
    return <AppVersion appVersion={appVersion.split('+')[0]} fullVersion={appVersion} />;
};
