import { c } from 'ttag';

import type { VERIFICATION_STATUS } from '@proton/crypto/lib/constants';

import { APPS, APPS_CONFIGURATION } from '../constants';
import type { MAIL_VERIFICATION_STATUS } from './constants';

const getPmSignatureLink = (pmSignatureReferralLinkEnabled: boolean, referralLink: string) => {
    if (pmSignatureReferralLinkEnabled && referralLink) {
        return referralLink;
    }
    return 'https://proton.me/mail/home';
};

export const getProtonMailSignature = (
    pmSignatureReferralLinkEnabled = false,
    referralLink = 'https://proton.me/mail/home',
    pmSignatureContent = ''
): string => {
    if (pmSignatureContent) {
        return pmSignatureContent;
    }

    const link = getPmSignatureLink(pmSignatureReferralLinkEnabled, referralLink);

    // translator: full sentence is: "Sent with Proton Mail secure email"
    return c('Info').t`Sent with <a href="${link}" target="_blank">${
        APPS_CONFIGURATION[APPS.PROTONMAIL].name
    }</a> secure email.`;
};

// MAIL_VERIFICATION_STATUS should be a superset of VERIFICATION_STATUS returned by the CryptoAPI.
// This converter is necessary since TS requires explicit casting between enums.
export const getMailVerificationStatus = (verificationStatus: VERIFICATION_STATUS): MAIL_VERIFICATION_STATUS =>
    verificationStatus.valueOf();

const EMPTY_SIGNATURE_PATTERNS = [/^(<div><br><\/div>)+$/, /^(<div>\s*<\/div>)+$/];

export const formatSignature = (value: string) =>
    EMPTY_SIGNATURE_PATTERNS.some((regex) => regex.test(value)) ? '' : value;
