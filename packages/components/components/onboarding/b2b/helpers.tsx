import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type {
    B2BFeaturesID,
    B2BFeaturesSection,
    B2BOnboardingFeature,
} from '@proton/components/components/onboarding/b2b/interface';
import canUseGroups from '@proton/components/containers/organization/groups/canUseGroups';
import { type Subscription, getPlan } from '@proton/payments';
import {
    APPS,
    type APP_NAMES,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DOCS_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    PROTON_SENTINEL_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { DRIVE_DOWNLOAD_URL } from '@proton/shared/lib/drive/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import twoFAImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-2fa.svg';
import appsImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-apps.svg';
import calendarSharingImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-calendar-sharing.svg';
import docsImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-collaboration.svg';
import zoomImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-conferencing.svg';
import driveAppImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-drive-download.svg';
import driveSharingImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-drive-sharing.svg';
import forwardImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-forward.svg';
import customDomainImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe.svg';
import userGroupsImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-groups.svg';
import easySwitchImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-import.svg';
import passImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-pass.svg';
import addUsersImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';
import securityBreachesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-shield-bolt.svg';
import securityImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-shield.svg';
import imapSmtpImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-tools.svg';
import vpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-vpn.svg';
import isTruthy from '@proton/utils/isTruthy';

export const getFeatures = (
    subscription: Subscription | undefined,
    onClickCTA?: (item: B2BFeaturesID) => Promise<void>
): B2BOnboardingFeature[] => {
    const plan = getPlan(subscription)?.Name;
    const canSeeGroupsSection = canUseGroups(plan, { isUserGroupsNoCustomDomainEnabled: false });

    return [
        {
            id: 'custom-domain',
            title: c('Title').t`Connect your custom domain`,
            description: c('Description')
                .t`Configure this first to activate your organization and customize your email address.`,
            kb: {
                title: c('Link').t`How to set up a custom domain`,
                link: getKnowledgeBaseUrl('/custom-domain'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/domain-names"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('custom-domain')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Set up a custom domain`} />
                </ButtonLike>
            ),
            illustration: customDomainImg,
            canShowFeature: true,
        },
        {
            id: 'add-users',
            title: c('Title').t`Add user`,
            description: c('Description').t`Set up accounts for all users and invite them to join ${BRAND_NAME}.`,
            kb: {
                title: c('Link').t`How to add users`,
                link: getKnowledgeBaseUrl('/add-users-organization'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/users-addresses"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('add-users')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Manage users/addresses`} />
                </ButtonLike>
            ),
            illustration: addUsersImg,
            canShowFeature: true,
        },
        {
            id: 'easy-switch',
            title: c('Title').t`Import emails, calendars, contacts`,
            description: c('Description')
                .t`For a seamless transition to ${BRAND_NAME}, import your data from Google, Outlook, and others.`,
            kb: {
                title: c('Link').t`How to migrate to ${BRAND_NAME}`,
                link: getKnowledgeBaseUrl('/easy-switch-emails'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/easy-switch"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('easy-switch')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Import emails, calendars, contacts`} />
                </ButtonLike>
            ),
            illustration: easySwitchImg,
            canShowFeature: true,
        },
        {
            id: 'recovery',
            title: c('Title').t`Set recovery methods`,
            description: c('Description')
                .t`Ensure you can still access your account and data even if you lose your ${BRAND_NAME} password.`,
            kb: {
                title: c('Link').t`Types of recovery methods`,
                link: getKnowledgeBaseUrl('/account-recovery-methods'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/recovery"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('recovery')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Set recovery methods`} />
                </ButtonLike>
            ),
            illustration: recoveryImg,
            canShowFeature: true,
        },
        {
            id: '2fa',
            title: c('Title').t`Enhance security with 2FA`,
            description: c('Description')
                .t`Encourage the use of two-factor authentication in your organization for extra security.`,
            kb: {
                title: c('Link').t`Enforcing 2FA for organizations`,
                link: getKnowledgeBaseUrl('/two-factor-authentication-organization'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/account-password#two-fa"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('2fa')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Set up 2FA`} />
                </ButtonLike>
            ),
            illustration: twoFAImg,
            canShowFeature: true,
        },
        {
            id: 'user-groups',
            title: c('Title').t`Simplify email distribution`,
            description: c('Description').t`Create groups you can email with a single address.`,
            kb: {
                title: c('Link').t`How to use Groups`,
                link: getKnowledgeBaseUrl('/groups'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/user-groups"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('user-groups')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Manage groups`} />
                </ButtonLike>
            ),
            illustration: userGroupsImg,
            canShowFeature: canSeeGroupsSection,
        },
        {
            id: 'security',
            title: c('Title').t`Enable advanced account protection`,
            description: c('Description')
                .t`Ensure top-notch security for your account with the ${PROTON_SENTINEL_NAME} program.`,
            kb: {
                title: c('Link').t`How to enable ${PROTON_SENTINEL_NAME}`,
                link: getKnowledgeBaseUrl('/proton-sentinel'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/security"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('security')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Manage advanced account protections`} />
                </ButtonLike>
            ),
            illustration: securityImg,
            canShowFeature: true,
        },
        {
            id: 'security-breaches',
            title: c('Title').t`Turn on ${DARK_WEB_MONITORING_NAME}`,
            description: c('Description')
                .t`Get notified if your password or other data was leaked from a third-party service.`,
            kb: {
                title: c('Link').t`How to use ${DARK_WEB_MONITORING_NAME}`,
                link: getKnowledgeBaseUrl('/dark-web-monitoring'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/security#breaches"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('security-breaches')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Turn on ${DARK_WEB_MONITORING_NAME}`} />
                </ButtonLike>
            ),
            illustration: securityBreachesImg,
            canShowFeature: true,
        },
        {
            id: 'get-the-apps',
            title: c('Title').t`Get the apps`,
            description: c('Description').t`Easily access your email and calendar on desktop and mobile.`,
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/get-the-apps"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('get-the-apps')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Get the apps`} />
                </ButtonLike>
            ),
            illustration: appsImg,
            canShowFeature: true,
        },
        {
            id: 'imap-smtp',
            title: c('Title').t`Connect apps and devices`,
            description: c('Description').t`Connect your CRM, website, printers, and more.`,
            kb: {
                title: c('Link').t`How to set up SMTP`,
                link: getKnowledgeBaseUrl('/smtp-submission'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/imap-smtp"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('imap-smtp')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Connect apps and devices`} />
                </ButtonLike>
            ),
            illustration: imapSmtpImg,
            canShowFeature: true,
        },
        {
            id: 'email-forwarding',
            title: c('Title').t`Set up email forwarding`,
            description: c('Description').t`Automatically forward incoming email to another email address.`,
            kb: {
                title: c('Link').t`How to use email forwarding`,
                link: getKnowledgeBaseUrl('/email-forwarding'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/auto-reply"
                    app={APPS.PROTONMAIL}
                    onClick={() => onClickCTA?.('email-forwarding')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Set up email forwarding`} />
                </ButtonLike>
            ),
            illustration: forwardImg,
            canShowFeature: true,
        },
        {
            id: 'calendar-sharing',
            title: c('Title').t`Share your calendar with your team`,
            description: c('Description').t`Simplify syncing and scheduling with shared calendars.`,
            kb: {
                title: c('Link').t`How to share a calendar`,
                link: getKnowledgeBaseUrl('/share-calendar-via-link'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/calendars"
                    app={APPS.PROTONCALENDAR}
                    onClick={() => onClickCTA?.('calendar-sharing')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Share your calendar with your team`} />
                </ButtonLike>
            ),
            illustration: calendarSharingImg,
            canShowFeature: true,
        },
        {
            id: 'calendar-zoom',
            title: c('Title').t`Connect to video conferencing`,
            description: c('Description').t`Let's you instantly add meeting links to your event invitations.`,
            kb: {
                title: c('Link').t`How to add Zoom links`,
                link: getKnowledgeBaseUrl('/calendar-zoom'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/video-conferencing"
                    app={APPS.PROTONCALENDAR}
                    onClick={() => onClickCTA?.('calendar-zoom')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Connect to video conferencing`} />
                </ButtonLike>
            ),
            illustration: zoomImg,
            canShowFeature: true,
        },
        {
            id: 'share-files',
            title: c('Title').t`Upload and share files`,
            description: c('Description')
                .t`Add folders and files to ${DRIVE_APP_NAME} and invite team members to view or edit.`,
            kb: {
                title: c('Link').t`How to share via email`,
                link: getKnowledgeBaseUrl('/drive-how-to-share-files-via-email'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={AppLink}
                    to="/shared-urls"
                    toApp={APPS.PROTONDRIVE}
                    onClick={() => onClickCTA?.('share-files')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Upload and share files`} />
                </ButtonLike>
            ),
            illustration: driveSharingImg,
            canShowFeature: true,
        },
        {
            id: 'docs',
            title: c('Title').t`Collaborate on documents`,
            description: c('Description')
                .t`${DOCS_SHORT_APP_NAME} in ${DRIVE_APP_NAME} allows you to work together with others in a secure, encrypted environment.`,
            kb: {
                title: c('Link').t`How to collaborate in ${DOCS_SHORT_APP_NAME}`,
                link: getKnowledgeBaseUrl('/drive-collaborate-in-docs'),
            },
            cta: (
                <ButtonLike
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={AppLink}
                    to="/"
                    toApp={APPS.PROTONDOCS}
                    onClick={() => onClickCTA?.('docs')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Collaborate on documents`} />
                </ButtonLike>
            ),
            illustration: docsImg,
            canShowFeature: true,
        },
        {
            id: 'get-drive-app',
            title: c('Title').t`Download ${DRIVE_APP_NAME} apps`,
            description: c('Description')
                .t`Easily sync files to the cloud from your desktop and access them from your mobile device.`,
            cta: (
                <ButtonLike
                    key="desktopButton"
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as="a"
                    href={DRIVE_DOWNLOAD_URL}
                    onClick={() => onClickCTA?.('get-drive-app')}
                    target="_blank"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Download ${DRIVE_APP_NAME} apps`} />
                </ButtonLike>
            ),
            illustration: driveAppImg,
            canShowFeature: true,
        },
        {
            id: 'use-vpn',
            title: c('Title').t`Use ${VPN_SHORT_APP_NAME} for data privacy`,
            description: c('Description')
                .t`Ensure secure access to organization data, even if your team is remote or using public WiFi.`,
            kb: {
                title: c('Link').t`How to set up ${VPN_APP_NAME}`,
                link: getKnowledgeBaseUrl('/setup-vpn-business'),
            },
            cta: (
                <ButtonLike
                    key="desktopButton"
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={SettingsLink}
                    path="/dashboardV2"
                    app={APPS.PROTONVPN_SETTINGS}
                    onClick={() => onClickCTA?.('use-vpn')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Use ${VPN_SHORT_APP_NAME} for data privacy`} />
                </ButtonLike>
            ),
            illustration: vpnImg,
            canShowFeature: true,
        },
        {
            id: 'password-management',
            title: c('Title').t`Simplify password management`,
            description: c('Description')
                .t`Help your team securely store passwords to sensitive business and client information.`,
            kb: {
                title: c('Link').t`How to use ${PASS_APP_NAME} for Business`,
                link: getKnowledgeBaseUrl('/pass'),
            },
            cta: (
                <ButtonLike
                    key="desktopButton"
                    className="expand-click-area"
                    shape="ghost"
                    icon
                    as={AppLink}
                    to="/"
                    toApp={APPS.PROTONPASS}
                    onClick={() => onClickCTA?.('password-management')}
                    target="_self"
                >
                    <Icon name="chevron-right" alt={c('Action').t`Use ${PASS_APP_NAME} for Business`} />
                </ButtonLike>
            ),
            illustration: passImg,
            canShowFeature: true,
        },
    ];
};

export const getSections = (app: APP_NAMES, parentApp?: APP_NAMES): B2BFeaturesSection[] => {
    const canShowGetTheAppsInMail = app !== APPS.PROTONCALENDAR && parentApp !== APPS.PROTONCALENDAR;

    const orgSetupSection: B2BFeaturesSection = {
        title: c('Section').t`Org setup and account security`,
        featuresList: ['custom-domain', 'add-users', 'easy-switch', 'recovery', '2fa', 'security', 'security-breaches'],
    };

    const mailSection: B2BFeaturesSection = {
        title: MAIL_APP_NAME,
        featuresList: [
            // Do not show get the apps in mail section if calendar
            canShowGetTheAppsInMail && 'get-the-apps',
            'imap-smtp',
            'user-groups',
            'email-forwarding',
        ].filter(isTruthy) as B2BFeaturesID[],
    };

    const calendarSection: B2BFeaturesSection = {
        title: CALENDAR_APP_NAME,
        featuresList: [
            // Do not show get the apps in calendar section if mail
            !canShowGetTheAppsInMail && 'get-the-apps',
            'calendar-sharing',
            'calendar-zoom',
        ].filter(isTruthy) as B2BFeaturesID[],
    };

    const driveSection: B2BFeaturesSection = {
        title: DRIVE_APP_NAME,
        featuresList: ['get-drive-app', 'share-files', 'docs'],
    };

    const vpnSection: B2BFeaturesSection = {
        title: VPN_APP_NAME,
        featuresList: ['use-vpn'],
    };

    const passSection: B2BFeaturesSection = {
        title: PASS_APP_NAME,
        featuresList: ['password-management'],
    };

    if (app === APPS.PROTONCALENDAR || (app === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR)) {
        return [orgSetupSection, calendarSection, mailSection, driveSection, vpnSection, passSection];
    }

    if (app === APPS.PROTONDRIVE || (app === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE)) {
        return [orgSetupSection, driveSection, mailSection, calendarSection, vpnSection, passSection];
    }

    return [orgSetupSection, mailSection, calendarSection, driveSection, vpnSection, passSection];
};
