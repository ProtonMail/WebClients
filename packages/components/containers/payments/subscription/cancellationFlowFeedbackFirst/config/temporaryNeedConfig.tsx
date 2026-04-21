import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import AppsLogos from '@proton/components/components/appsLogos/AppsLogos';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import FreeLogo from '@proton/components/containers/payments/subscription/FreeLogo/FreeLogo';
import CustomLogo from '@proton/components/containers/payments/subscription/YourPlanSectionV2/CustomLogo';
import type { CustomLogoPlanName } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/CustomLogo';
import { IcAt } from '@proton/icons/icons/IcAt';
import { IcCalendarCheckmark } from '@proton/icons/icons/IcCalendarCheckmark';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { IcDiamond } from '@proton/icons/icons/IcDiamond';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcEnvelopeArrowUpAndRight } from '@proton/icons/icons/IcEnvelopeArrowUpAndRight';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcRocket } from '@proton/icons/icons/IcRocket';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcSignature } from '@proton/icons/icons/IcSignature';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcTag } from '@proton/icons/icons/IcTag';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import type { FreePlanDefault, Plan } from '@proton/payments';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    MAIL_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { SizeUnits } from '@proton/shared/lib/helpers/humanSize';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import type { ComparisonFeatureRow } from '../components/ComparisonTable';

interface TemporaryNeedPlanConfig {
    currentPlanHeader: ReactNode;
    freePlanHeader: ReactNode;
    subtitle: string;
    features: ComparisonFeatureRow[];
}

const Dash = () => {
    return <IcMinus />;
};

const getStorageValue = (bytes: number | undefined, unit: SizeUnits) => {
    return humanSize({ bytes, fraction: 0, unit });
};

const yes = () => {
    return c('Label').t`Yes`;
};

interface PlanValues {
    planMaxSpaceBytes: number | undefined;
    freeMaxBaseSpaceBytes: number | undefined;
    freeMaxDriveSpaceBytes: number | undefined;
    planAddresses: number;
    planDomains: number;
    planMembers: number;
    freeMaxAddresses: number;
    freeMaxCalendars: number;
}

const getMailFeatures = ({
    planMaxSpaceBytes,
    freeMaxBaseSpaceBytes,
    planAddresses,
    freeMaxAddresses,
    freeMaxCalendars,
}: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'GB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcGift />,
            label: c('Label').t`Yearly free storage bonus`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcEnvelope />,
            label: c('Label').t`Email addresses`,
            leftValue: `${planAddresses}`,
            rightValue: `${freeMaxAddresses}`,
        },
        {
            icon: <IcTag />,
            label: c('Label').t`Folders, labels, and filters`,
            leftValue: c('Label').t`Unlimited`,
            rightValue: `${freeMaxCalendars}`,
        },
        {
            icon: <IcGlobe />,
            label: c('Label').t`Custom domain`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcAt />,
            label: c('Label').t`Short domain @pm.me`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDesktop />,
            label: c('Label').t`${BRAND_NAME} ${MAIL_SHORT_APP_NAME} desktop app`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
    ];
};

const getBundleFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'GB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcGift />,
            label: c('Label').t`Yearly free storage bonus`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcShield />,
            label: c('Label').t`${PROTON_SENTINEL_NAME} account protection`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getDriveFeatures = ({ planMaxSpaceBytes, freeMaxDriveSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    const storageUnit = planMaxSpaceBytes === 1099511627776 ? 'TB' : 'GB';
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, storageUnit),
            rightValue: getStorageValue(freeMaxDriveSpaceBytes, 'GB'),
        },
        {
            icon: <IcGift />,
            label: c('Label').t`Yearly free storage bonus`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcClockRotateLeft />,
            label: c('Label').t`Version history`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
    ];
};

const getDuoFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'TB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcUsers />,
            label: c('Label').t`Users`,
            leftValue: DUO_MAX_USERS,
            rightValue: `1`,
        },
        {
            icon: <IcShield />,
            label: c('Label').t`${PROTON_SENTINEL_NAME} account protection`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getFamilyFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'TB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcUsers />,
            label: c('Label').t`Users`,
            leftValue: FAMILY_MAX_USERS,
            rightValue: `1`,
        },
        {
            icon: <IcShield />,
            label: c('Label').t`${PROTON_SENTINEL_NAME} protection`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getVisionaryFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'TB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcUsers />,
            label: c('Label').t`Users`,
            leftValue: FAMILY_MAX_USERS,
            rightValue: `1`,
        },
        {
            icon: <IcRocket />,
            label: c('Label').t`Early access`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcShield />,
            label: c('Label').t`${PROTON_SENTINEL_NAME} protection`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getMailEssentialFeatures = ({
    planMaxSpaceBytes,
    freeMaxBaseSpaceBytes,
    planDomains,
    planAddresses,
    freeMaxAddresses,
}: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcUsers />,
            label: c('Label').t`Support for multiple users`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage per user`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'GB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcEnvelopes />,
            label: c('Label').t`Email addresses per user`,
            leftValue: `${planAddresses}`,
            rightValue: `${freeMaxAddresses}`,
        },
        {
            icon: <IcGlobe />,
            label: c('Label').ngettext(msgid`Custom email domain`, `Custom email domains`, planDomains),
            leftValue: `${planDomains}`,
            rightValue: <Dash />,
        },
        {
            icon: <IcEnvelopeArrowUpAndRight />,
            label: c('Label').t`Automatic email forwarding`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcCalendarCheckmark />,
            label: c('Label').t`See your team's availability`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcAt />,
            label: c('Label').t`Catch-all email address`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDesktop />,
            label: c('Label').t`${BRAND_NAME} ${MAIL_SHORT_APP_NAME} Desktop app`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
    ];
};

const getMailProFeatures = ({
    planMaxSpaceBytes,
    freeMaxBaseSpaceBytes,
    planDomains,
    planAddresses,
    freeMaxAddresses,
}: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcUsers />,
            label: c('Label').t`Support for multiple users`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage per user`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'GB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcEnvelopes />,
            label: c('Label').t`Email addresses per user`,
            leftValue: `${planAddresses}`,
            rightValue: `${freeMaxAddresses}`,
        },
        {
            icon: <IcGlobe />,
            label: c('Label').ngettext(msgid`Custom email domain`, `Custom email domains`, planDomains),
            leftValue: `${planDomains}`,
            rightValue: <Dash />,
        },
        {
            icon: <IcEnvelopeArrowUpAndRight />,
            label: c('Label').t`Automatic email forwarding`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcCalendarCheckmark />,
            label: c('Label').t`See your team's availability`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcAt />,
            label: c('Label').t`Catch-all email address`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDesktop />,
            label: c('Label').t`${BRAND_NAME} ${MAIL_SHORT_APP_NAME} Desktop app`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
    ];
};

const getBundleProFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcUsers />,
            label: c('Label').t`Support for multiple users`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage per user`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'TB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcSignature />,
            label: c('Label').t`Brand your workspace`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getWorkspaceFeatures = ({ planMaxSpaceBytes, freeMaxBaseSpaceBytes }: PlanValues): ComparisonFeatureRow[] => {
    return [
        {
            icon: <IcUsers />,
            label: c('Label').t`Support for multiple users`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcStorage />,
            label: c('Label').t`Storage per user`,
            leftValue: getStorageValue(planMaxSpaceBytes, 'TB'),
            rightValue: getStorageValue(freeMaxBaseSpaceBytes, 'GB'),
        },
        {
            icon: <IcSignature />,
            label: c('Label').t`Brand your workspace`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcLifeRing />,
            label: c('Label').t`Priority support`,
            leftValue: yes(),
            rightValue: <Dash />,
        },
        {
            icon: <IcDiamond />,
            label: c('Label').t`Premium features included`,
            leftValue: (
                <AppsLogos
                    className="justify-center"
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                        APPS.PROTONMEET,
                    ]}
                />
            ),
            rightValue: <Dash />,
        },
    ];
};

const getMailPlusSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} goes beyond the basics to help you be more productive, organized, and in control of your inbox, email identity, and more.`;
};

const getBundleSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} gives you access to all apps and premium features. Privacy is built-in so you can get on with it, knowing your data and identity are safe.`;
};

const getDrive200GBSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} offers 200 GB storage for your files and photos. You are also eligible for yearly storage bonuses.`;
};

const getDrive1TBSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} offers 1 TB storage for your files and photos. You are also eligible for yearly storage bonuses.`;
};

const getDuoSubtitle = (planTitle: string) => {
    return c('Subtitle').t`${planTitle} gives you unlimited privacy and more storage for up to 2 people.`;
};

const getFamilySubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} helps you ensure that each of your family members — and their data — are protected whenever they’re online.`;
};

const getVisionarySubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} gives you all apps, all features, early access to new releases, and everything you need to be in control of your data and its security.`;
};

const getMailB2BSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} gives your team what they need to be more productive, organized, and in control of their inbox, schedule, and more.`;
};

const getBusinessSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} gives your team what they need to be more productive and organized in their work with access to all ${BRAND_NAME} apps and their advanced features.`;
};

const getWorkspaceSubtitle = (planTitle: string) => {
    return c('Subtitle')
        .t`${planTitle} gives your team all the collaboration tools they need to be productive and organized in their work, while safeguarding your business.`;
};

export const getTemporaryNeedConfig = (plan: Plan, freePlan: FreePlanDefault): TemporaryNeedPlanConfig | undefined => {
    const planTitle = plan.Title;
    const planDisplayName = PLAN_NAMES[plan.Name as PLANS] ?? planTitle;

    const values: PlanValues = {
        planMaxSpaceBytes: plan.MaxSpace,
        freeMaxBaseSpaceBytes: freePlan.MaxBaseSpace,
        freeMaxDriveSpaceBytes: freePlan.MaxDriveSpace,
        planAddresses: plan.MaxAddresses,
        planDomains: plan.MaxDomains,
        planMembers: plan.MaxMembers,
        freeMaxAddresses: freePlan.MaxAddresses,
        freeMaxCalendars: freePlan.MaxCalendars,
    };

    const makeFreePlanHeader = (app: APP_NAMES) => {
        return (
            <>
                <FreeLogo app={app} size={28} />
                <span className="text-semibold">{c('Label').t`Free`}</span>
            </>
        );
    };

    const mailFreePlanHeader = makeFreePlanHeader(APPS.PROTONMAIL);
    const driveFreePlanHeader = makeFreePlanHeader(APPS.PROTONDRIVE);

    const makePlanHeader = (planName: CustomLogoPlanName) => {
        let logo;

        if (planName === PLANS.MAIL) {
            logo = <MailLogo variant="glyph-only" size={7} />;
        } else if (planName === PLANS.DRIVE || planName === PLANS.DRIVE_1TB) {
            logo = <DriveLogo variant="glyph-only" size={7} />;
        } else {
            logo = <CustomLogo className="rounded" planName={planName} size={28} />;
        }

        return (
            <>
                {logo}
                <span className="text-semibold">{planDisplayName}</span>
            </>
        );
    };

    const configs: Partial<Record<PLANS, TemporaryNeedPlanConfig>> = {
        [PLANS.MAIL]: {
            currentPlanHeader: makePlanHeader(PLANS.MAIL),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getMailPlusSubtitle(planTitle),
            features: getMailFeatures(values),
        },
        [PLANS.BUNDLE]: {
            currentPlanHeader: makePlanHeader(PLANS.BUNDLE),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getBundleSubtitle(planTitle),
            features: getBundleFeatures(values),
        },
        [PLANS.DRIVE]: {
            currentPlanHeader: makePlanHeader(PLANS.DRIVE),
            freePlanHeader: driveFreePlanHeader,
            subtitle: getDrive200GBSubtitle(planTitle),
            features: getDriveFeatures(values),
        },
        [PLANS.DRIVE_1TB]: {
            currentPlanHeader: makePlanHeader(PLANS.DRIVE),
            freePlanHeader: driveFreePlanHeader,
            subtitle: getDrive1TBSubtitle(planTitle),
            features: getDriveFeatures(values),
        },
        [PLANS.DUO]: {
            currentPlanHeader: makePlanHeader(PLANS.DUO),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getDuoSubtitle(planTitle),
            features: getDuoFeatures(values),
        },
        [PLANS.FAMILY]: {
            currentPlanHeader: makePlanHeader(PLANS.FAMILY),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getFamilySubtitle(planTitle),
            features: getFamilyFeatures(values),
        },
        [PLANS.VISIONARY]: {
            currentPlanHeader: makePlanHeader(PLANS.VISIONARY),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getVisionarySubtitle(planTitle),
            features: getVisionaryFeatures(values),
        },
        [PLANS.MAIL_PRO]: {
            currentPlanHeader: makePlanHeader(PLANS.MAIL_PRO),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getMailB2BSubtitle(planTitle),
            features: getMailEssentialFeatures(values),
        },
        [PLANS.MAIL_BUSINESS]: {
            currentPlanHeader: makePlanHeader(PLANS.MAIL_BUSINESS),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getMailB2BSubtitle(planTitle),
            features: getMailProFeatures(values),
        },
        [PLANS.BUNDLE_PRO]: {
            currentPlanHeader: makePlanHeader(PLANS.BUNDLE_PRO_2024), // CustomLogo has no specific icon defined for BUNDLE_PRO
            freePlanHeader: mailFreePlanHeader,
            subtitle: getBusinessSubtitle(planTitle),
            features: getBundleProFeatures(values),
        },
        [PLANS.BUNDLE_PRO_2024]: {
            currentPlanHeader: makePlanHeader(PLANS.BUNDLE_BIZ_2025), // CustomLogo has a different logo for BUNDLE_PRO_2024, we want BUNDLE_BIZ_2025 in this case
            freePlanHeader: mailFreePlanHeader,
            subtitle: getWorkspaceSubtitle(planTitle),
            features: getWorkspaceFeatures(values),
        },
        [PLANS.BUNDLE_BIZ_2025]: {
            currentPlanHeader: makePlanHeader(PLANS.BUNDLE_BIZ_2025),
            freePlanHeader: mailFreePlanHeader,
            subtitle: getWorkspaceSubtitle(planTitle),
            features: getWorkspaceFeatures(values),
        },
    };

    return configs[plan.Name as PLANS];
};
