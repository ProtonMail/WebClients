import { getEpoch } from '@proton/pass/utils/time/epoch';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';

const createFilename = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${AUTHENTICATOR_APP_NAME}_export_${year}-${month}-${day}`;
};

export const getBackupFilenameRegex = () =>
    new RegExp(`^${AUTHENTICATOR_APP_NAME}_export_\\d{4}-\\d{2}-\\d{2}\\.json$`);

export const parseDateFromFilename = (filename: string) => {
    const regex = new RegExp(`^${AUTHENTICATOR_APP_NAME}_export_(\\d{4})-(\\d{2})-(\\d{2})\\.json$`);
    const match = filename.match(new RegExp(regex));
    if (!match) return null;

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
};

export const createAutomaticBackupFilename = () => `${createFilename()}.json`;

/** Non-automatic backups have a different format to avoid
 * matching them in the user's backup directory. */
export const createBackupFilename = () => `${createAutomaticBackupFilename()}_${getEpoch()}.json`;
