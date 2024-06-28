import { c } from 'ttag';

import { logger } from '@proton/pass/utils/logger';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

/** Safari browser extensions don't properly support the
 * HTML download attribute or `createObjectURL` */
export const download = (file: File) => {
    if (BUILD_TARGET === 'safari') {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = reader.result?.toString();
            if (!base64data) {
                const errorMessage = c('Error').t`File could not be read`;
                logger.warn('[Safari]', errorMessage);
                throw new Error(errorMessage);
            }
            const link = document.createElement('a');
            link.href = base64data;
            /* currently ignored by Safari extensions and the filename will be "Unknown"
            /* but hopefully a future Safari update will fix this */
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    } else {
        downloadFile(file, file.name);
    }
};
