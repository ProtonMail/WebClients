export const mapTelemetryOsVersionWithStore = (version: string) => {
    const lowerCaseVersion = version.toLowerCase();
    switch (lowerCaseVersion) {
        // Case for packages/vpn/src/components/VPNDownloadSection/DownloadSection.tsx title
        case 'iPhone/iPad':
        case 'ios':
            return 'app_store';
        case 'android':
            return 'google_play';
        default:
            return lowerCaseVersion;
    }
};
