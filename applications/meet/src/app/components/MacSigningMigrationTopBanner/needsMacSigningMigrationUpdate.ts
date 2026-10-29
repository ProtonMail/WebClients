import { semver } from '@proton/utils/semver';

const FIRST_MIGRATED_VERSION = '1.0.14';

interface MeetDesktopEnvironment {
    isMeetDesktopApp: boolean;
    isMac: boolean;
    version: string | undefined;
}

export const needsMacSigningMigrationUpdate = ({ isMeetDesktopApp, isMac, version }: MeetDesktopEnvironment) =>
    isMeetDesktopApp && isMac && version !== undefined && semver(version) < semver(FIRST_MIGRATED_VERSION);
