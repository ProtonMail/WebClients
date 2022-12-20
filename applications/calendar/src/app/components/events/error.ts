import { c } from 'ttag';

export const getEventErrorMessage = (error: Error) => {
    if (!error) {
        return '';
    }
    const errorMessage = error.message || '';
    return errorMessage.toLowerCase().includes('decrypt')
        ? c('Error').t`Decryption error: Decryption of this event's content failed.`
        : c('Error').t`Error: ${errorMessage}`;
};

export const getEventLoadingMessage = () => c('Info').t`Loading event`;
