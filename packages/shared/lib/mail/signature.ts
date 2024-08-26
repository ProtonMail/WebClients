import { c } from 'ttag';

import { APPS, APPS_CONFIGURATION } from '../constants';

interface Options {
    isReferralProgramLinkEnabled?: boolean;
    referralProgramUserLink?: string;
}

export const getProtonMailSignature = ({
    isReferralProgramLinkEnabled = false,
    referralProgramUserLink,
}: Options = {}) => {
    const link =
        isReferralProgramLinkEnabled && referralProgramUserLink
            ? referralProgramUserLink
            : 'https://proton.me/mail/home';

    // translator: full sentence is: "Sent with Proton Mail secure email"
    const signature = c('Info').t`Sent with <a href="${link}" target="_blank">${
        APPS_CONFIGURATION[APPS.PROTONMAIL].name
    }</a> secure email.`;

    return signature;
};
