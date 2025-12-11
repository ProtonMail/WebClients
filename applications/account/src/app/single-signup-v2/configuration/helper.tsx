import { c } from 'ttag';

import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcShield } from '@proton/icons/icons/IcShield';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import type { BenefitItem } from '../Benefits';
import swissFlag from '../flag.svg';

export const getBenefits = (appName: string) => {
    return c('pass_signup_2023: Info').t`${appName} benefits`;
};

export const getJoinB2BString = () => {
    return c('drive_signup_2024: Info')
        .t`Join the 50,000+ organizations already benefiting from ${BRAND_NAME}'s security`;
};
export const getJoinString = (audience?: Audience) => {
    if (audience === Audience.B2B) {
        return getJoinB2BString();
    }
    return c('pass_signup_2023: Info')
        .t`Join over 100 million people who have chosen ${BRAND_NAME} to stay safe online`;
};

export const getBasedString = () => {
    return c('pass_signup_2023: Info').t`Based in Switzerland, GDPR compliant`;
};

export const getGenericBenefits = (): BenefitItem[] => {
    return [
        {
            key: 10,
            text: c('pass_signup_2023: Info').t`Protected by Swiss privacy laws`,
            icon: {
                name: 'shield',
            },
        },
        {
            key: 11,
            text: c('pass_signup_2023: Info').t`Open-source and audited`,
            icon: {
                name: 'magnifier',
            },
        },
    ];
};

export const getBuiltInEncryptionBenefit = (): BenefitItem => {
    return {
        key: `built-in-encryption`,
        text: c('Signup: Info').t`Built-in encryption`,
        icon: {
            name: 'lock',
        },
    };
};

export const getEndToEndEncryptionBenefit = (): BenefitItem => {
    return {
        key: `end-to-end-encryption`,
        text: c('Signup: Info').t`End-to-end encryption`,
        icon: {
            name: 'lock',
        },
    };
};

export const getSwissPrivacyLawsBenefit = (): BenefitItem => {
    return {
        key: `swiss-privacy-laws`,
        text: c('Signup: Info').t`Protected by Swiss privacy laws`,
        icon: {
            name: 'shield',
        },
    };
};

export const getWorksOnAllDevicesBenefit = (): BenefitItem => {
    return {
        key: `works-on-all-devices`,
        text: c('Signup: Info').t`Works on all devices`,
        icon: {
            name: 'mobile',
        },
    };
};

export const getISO27001CertifiedBenefit = (): BenefitItem => {
    return {
        key: `iso27001-certified`,
        text: c('Signup: Info').t`ISO 27001 certified`,
        icon: {
            name: 'globe',
        },
    };
};

export const getBasedInSwitzerlandGDPRBenefit = (): BenefitItem => {
    return {
        key: `based-in-switzerland-gdpr`,
        text: c('Signup: Info').t`Based in Switzerland, GDPR compliant`,
        icon: {
            name: 'shield',
        },
    };
};

export const getTeamKnowsEncryptionBenefit = (): BenefitItem => {
    return {
        key: `team-knows-encryption`,
        text: c('Signup: Info').t`From the team that knows encryption`,
        icon: {
            name: 'lock',
        },
    };
};

export const getOpenSourceAndAuditedBenefit = (): BenefitItem => {
    return {
        key: `open-source-and-audited`,
        text: c('Signup: Info').t`Open source and audited`,
        icon: {
            name: 'magnifier',
        },
    };
};

export const getAppsMailIncludedBenefit = (): BenefitItem => {
    return {
        key: `apps-mail-included`,
        text: c('Signup: Info').t`Calendar, password manager, file storage, and VPN included`,
        icon: {
            name: 'grid-2',
        },
    };
};

export const getAppsIncludedBenefit = (): BenefitItem => {
    return {
        key: `apps-included`,
        text: c('Signup: Info').t`Integrated email, calendar, file storage, password manager, and VPN`,
        icon: {
            name: 'grid-2',
        },
    };
};

export const getEmailAliasesBenefit = (): BenefitItem => {
    return {
        key: `email-aliases`,
        text: c('Signup: Info').t`Email aliases`,
        icon: {
            name: 'alias',
        },
    };
};

export const getUnlimitedPasswordsBenefit = (): BenefitItem => {
    return {
        key: `unlimited-passwords`,
        text: c('Signup: Info').t`Unlimited passwords`,
        icon: {
            name: 'key',
        },
    };
};

export const getDeviceSyncBenefit = (): BenefitItem => {
    return {
        key: `device-sync`,
        text: c('Signup: Info').t`Device sync`,
        icon: {
            name: 'mobile',
        },
    };
};

export const getAliasesEmailProtectionBenefit = (): BenefitItem => {
    return {
        key: `aliases-email-protection`,
        text: c('Signup: Info').t`10 aliases for email protection from breaches`,
        icon: {
            name: 'alias',
        },
    };
};

export const getAdvancedSecurityBenefit = (): BenefitItem => {
    return {
        key: `advanced-security`,
        text: c('Signup: Info').t`Advanced security features`,
        icon: {
            name: 'sliders',
        },
    };
};

export const getScribeBenefit = (): BenefitItem => {
    return {
        key: `scribe-benefit`,
        text: c('mail_signup_2024: Info').t`${BRAND_NAME} Scribe writing assistant`,
        icon: {
            name: 'pen-sparks',
        },
    };
};

export const getBundleVisionaryBenefits = (): BenefitItem[] => {
    return [
        getEndToEndEncryptionBenefit(),
        getSwissPrivacyLawsBenefit(),
        getOpenSourceAndAuditedBenefit(),
        getWorksOnAllDevicesBenefit(),
        getAppsIncludedBenefit(),
    ];
};

export const getFamilyDuoBenefits = (): BenefitItem[] => {
    return [
        getEndToEndEncryptionBenefit(),
        getSwissPrivacyLawsBenefit(),
        getOpenSourceAndAuditedBenefit(),
        getScribeBenefit(),
        getAppsIncludedBenefit(),
    ];
};

export const getSwissFeature = ({ fullText }: { fullText: boolean }) => ({
    key: 'swiss',
    left: <img width="24" alt="" src={swissFlag} className="rounded-sm" />,
    text: fullText
        ? c('pass_signup_2023: Feature').t`Protected by Swiss privacy laws`
        : c('pass_signup_2023: Feature').t`Swiss based`,
});

export const getEncryptedFeature = ({ e2ee }: { e2ee: boolean }) => ({
    key: 'e2e',
    left: <IcLock size={6} className="color-primary" />,
    text: e2ee ? c('pass_signup_2023: Feature').t`End-to-end encrypted` : c('signup: Feature').t`Encrypted`,
});

export const getNoLogsFeature = () => ({
    key: 'no-logs',
    left: <IcEyeSlash size={6} className="color-primary" />,
    text: c('signup: Feature').t`Strict no-logs policy`,
});

export const getOpenSourceFeature = () => ({
    key: 'open-source',
    left: <IcGlobe size={6} className="color-primary" />,
    text: c('pass_signup_2023: Feature').t`Open source`,
});

export const getGenericFeatures = (isLargeViewport: boolean, audience?: Audience) => {
    const e2ee = getEncryptedFeature({ e2ee: true });

    const swiss = getSwissFeature({ fullText: isLargeViewport });

    const openSource = getOpenSourceFeature();

    const gdpr = {
        key: 'gdpr',
        left: <IcShield size={6} className="color-primary" />,
        text: c('signup_2024: Feature').t`GDPR and HIPAA compliant`,
    };

    const audienceSpecificFeatures = audience === Audience.B2B ? [e2ee, swiss, gdpr] : [e2ee, openSource, swiss];

    return audienceSpecificFeatures;
};
