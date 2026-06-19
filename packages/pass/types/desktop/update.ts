import type { MaybeNull } from '@proton/pass/types/utils';

export enum UpdateStatus {
    Idle = 0,
    Checking = 1,
    Downloading = 2,
    UpdateReady = 3,
    Error = 4,
}

export enum UpdateErrorType {
    ManifestUnavailable = 0,
    ManifestInvalid = 1,
    DownloadFailed = 2,
    InstallFailed = 3,
    NotEnoughDiskSpace = 4,
}

export type UpdateStore = {
    /** Random but fixed number to determine rollout */
    distribution: number;
    /** Users will fetch from beta channel or not */
    beta: boolean;
    /** Current updater status */
    status: UpdateStatus;
    /** Type of error when status is Error */
    errorType: MaybeNull<UpdateErrorType>;
    /** Debug only: allow to override current version to compare */
    currentVersion: string;
    /** New version that is found on remote version.json */
    newVersion: MaybeNull<string>;
    /** Current progress of a new version download */
    progress: MaybeNull<number>;
    /** Debug only: will trigger an error in mock download */
    mockDoDownloadError: boolean;
};
