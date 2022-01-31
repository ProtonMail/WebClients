import { c } from 'ttag';
import { APPS, APPS_CONFIGURATION } from '../constants';

export const getProtonMailSignature = () => {
    // translator: full sentence is: "Sent with ProtonMail secure email"
    return c('Info').t`Sent with <a href="https://protonmail.com/" target="_blank">${
        APPS_CONFIGURATION[APPS.PROTONMAIL].name
    }</a> secure email.`;
};
