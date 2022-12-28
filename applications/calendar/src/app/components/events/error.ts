import { c } from 'ttag';

import { naiveGetIsDecryptionError } from '@proton/shared/lib/calendar/helper';

export const getEventErrorMessage = (error: Error) => {
    if (!error) {
        return '';
    }
    const errorMessage = error.message || '';
    return naiveGetIsDecryptionError(error)
        ? c('Error').t`Decryption error: Decryption of this event's content failed.`
        : c('Error').t`Error: ${errorMessage}`;
};

export const getEventLoadingMessage = () => c('Info').t`Loading event`;
