import { c } from 'ttag';

import { APPS, APPS_CONFIGURATION } from '../constants';
import type { MAIL_VERIFICATION_STATUS } from './constants';
import type { VERIFICATION_STATUS } from '@proton/crypto/lib/constants';

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

// MAIL_VERIFICATION_STATUS should be a superset of VERIFICATION_STATUS returned by the CryptoAPI.
// This converter is necessary since TS requires explicit casting between enums.
export const getMailVerificationStatus = (verificationStatus: VERIFICATION_STATUS): MAIL_VERIFICATION_STATUS => verificationStatus.valueOf();