import type { DriveCompat } from './useDriveCompat';
import type { PublicDriveCompat } from './usePublicDriveCompat';

export type DriveCompatWrapper = {
    userCompat?: DriveCompat;
    publicCompat?: PublicDriveCompat;
};
