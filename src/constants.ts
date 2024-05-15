export const PARTITION = "persist:app";

export const ALLOWED_PERMISSIONS = ["clipboard-sanitized-write", "persistent-storage"];

export const CERT_PROTON_ME = [
    "CT56BhOTmj5ZIPgb/xD5mH8rY3BLo/MlhP7oPyJUEDo=", // Current
    "35Dx28/uzN3LeltkCBQ8RHK0tlNSa2kCpCRGNp34Gxc=", // Hot backup
    "qYIukVc63DEITct8sFT7ebIq5qsWmuscaIKeJx+5J5A=", // Cold backup
];

// TODO @proton/shared/lib/apps/desktopVersions.ts
export enum RELEASE_CATEGORIES {
    STABLE = 'Stable',
    ALPHA = 'Alpha',
    EARLY_ACCESS = 'EarlyAccess',
}

// TOOD import type { Environment } from '@proton/shared/lib/interfaces';
export type Environment = 'alpha' | 'beta';


