import { getEmailParts } from '@proton/shared/lib/helpers/email';

import { SignupType } from '../signup/interfaces';

export const getAccountDetailsFromEmail = ({
    email,
    domains,
    defaultDomain,
}: {
    email: string;
    domains: string[];
    defaultDomain: string | undefined;
}) => {
    const [local, domain] = getEmailParts(email);

    const protonDomain = (() => {
        if (!domain && defaultDomain) {
            return defaultDomain;
        }
        if (domain) {
            const lowerCaseDomain = domain.toLowerCase();
            return domains.find((domain) => lowerCaseDomain === domain);
        }
    })();

    if (protonDomain) {
        return {
            signupType: SignupType.Proton,
            local,
            domain: protonDomain,
        };
    }

    return {
        signupType: SignupType.External,
        local,
        domain,
    };
};
