export namespace SecurityCheckupCohort {
    export enum Common {
        NO_RECOVERY_METHOD = 'NO_RECOVERY_METHOD',
        COMPLETE_RECOVERY = 'COMPLETE_RECOVERY',
    }

    export enum Default {
        COMPLETE_RECOVERY_SINGLE = 'COMPLETE_RECOVERY_SINGLE',
        ACCOUNT_RECOVERY_ENABLED = 'ACCOUNT_RECOVERY_ENABLED',
    }

    export enum Sentinel {
        SENTINEL_RECOMMENDATIONS = 'SENTINEL_RECOMMENDATIONS',
        COMPLETE_RECOVERY_SENTINEL = 'COMPLETE_RECOVERY_SENTINEL',
    }
}

export type SecurityCheckupCohortType =
    | SecurityCheckupCohort.Common
    | SecurityCheckupCohort.Default
    | SecurityCheckupCohort.Sentinel;
