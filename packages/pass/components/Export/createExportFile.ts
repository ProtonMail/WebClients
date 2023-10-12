import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

export const createExportFile = (encrypted: boolean, data: string): { filename: string; blob: Blob } => {
    const content = encrypted ? data : base64StringToUint8Array(data);
    const timestamp = new Date().toISOString().split('T')[0];

    return {
        filename: `${PASS_APP_NAME}_export_${timestamp}.${encrypted ? 'pgp' : 'zip'}`,
        blob: new Blob([content], { type: encrypted ? 'application/zip' : 'data:text/plain;charset=utf-8;' }),
    };
};
