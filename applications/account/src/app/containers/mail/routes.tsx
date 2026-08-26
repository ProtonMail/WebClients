import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import type { SidebarConfig } from '@proton/components';
import { getMailRouteTitles } from '@proton/components/containers/account/constants/settingsRouteTitles';
import { ADDRESS_TYPE, APPS, MAIL_APP_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import { getIsExternalAccount } from '@proton/shared/lib/keys';

import type { OrganizationRouterParams } from '../../content/router-params';

export const getHasPmMeAddress = (addresses?: Address[]) => {
    return !!addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
};

const getShowPmMeSection = (user: UserModel, addresses: Address[] | undefined) => {
    if (addresses === undefined) {
        return false;
    }

    const { hasPaidMail, canPay } = user;
    const isExternalUser = getIsExternalAccount(user);
    const isPMAddressActive = getHasPmMeAddress(addresses);
    const hasNoOriginalAddresses = !addresses.some((address) => address.Type === ADDRESS_TYPE.TYPE_ORIGINAL);
    return !isExternalUser && canPay && !hasNoOriginalAddresses && !(isPMAddressActive && hasPaidMail);
};

export const getMailAppRoutes = ({
    app,
    user,
    addresses,
    organization,
    flags,
}: OrganizationRouterParams): SidebarConfig => {
    const { isCryptoPostQuantumOptInEnabled = false, isCategoryViewEnabled = false } = flags;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/using-folders-labels')}>{c('Link').t`Learn more`}</Href>
    );
    const mailRouteTitles = getMailRouteTitles();

    const isOrgAllowingCategoryView = organization ? organization.Settings.MailCategoryViewEnabled : false;

    return {
        available: app === APPS.PROTONMAIL || app === APPS.PROTONACCOUNT,
        header: MAIL_APP_NAME,
        routes: {
            desktop: {
                id: 'desktop',
                available: !isElectronMail,
                text: mailRouteTitles.desktop,
                to: '/get-the-apps',
                icon: 'arrow-down-line',
                subsections: [
                    {
                        id: 'proton-mail-mobile-apps',
                        text: c('Title').t`Download the mobile apps`,
                        keywords: [
                            c('account_search_index').t`App Store`,
                            c('account_search_index').t`Play Store`,
                            c('account_search_index').t`iOS and Android apps`,
                        ],
                    },
                    {
                        id: 'proton-mail-desktop-apps',
                        text: c('Title').t`Download the desktop app`,
                        keywords: [
                            c('Action').t`Download for Windows`,
                            c('Action').t`Download for macOS`,
                            c('account_search_index').t`Linux desktop app`,
                        ],
                    },
                ],
            },
            general: {
                id: 'general',
                text: mailRouteTitles.general,
                to: '/general',
                icon: 'envelope',
                subsections: [
                    {
                        text: c('Title').t`General`,
                        id: 'general',
                        keywords: [c('Label').t`Daily email notifications`, c('Label').t`Allow notifications by email`],
                    },
                    {
                        text: c('Title').t`Email categories`,
                        id: 'categories',
                        available: isCategoryViewEnabled && isOrgAllowingCategoryView,
                        keywords: [
                            c('Label').t`Use email categories`,
                            c('Label').t`Show unread count`,
                            c('account_search_index').t`Inbox tabs`,
                        ],
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: 'layout',
                        keywords: [
                            c('account_search_index').t`Inbox layout`,
                            c('Label').t`Density`,
                            c('Label to change density').t`Compact`,
                        ],
                    },
                    {
                        text: c('Title').t`Messages`,
                        id: 'messages',
                        keywords: [
                            c('Label').t`Conversation grouping`,
                            c('Label').t`Auto show embedded images`,
                            c('Label').t`Auto-unsubscribe`,
                        ],
                    },
                    {
                        text: c('Title').t`Composing`,
                        id: 'composing',
                        keywords: [
                            c('Label').t`Composer default font/size`,
                            c('Label').t`Undo send`,
                            c('Label').t`Composer text direction`,
                        ],
                    },
                    {
                        text: c('Title').t`Other preferences`,
                        id: 'other-preferences',
                        keywords: [
                            c('Title').t`Keyboard shortcuts`,
                            c('Label').t`Show sender images`,
                            c('Label').t`Automatically save contacts`,
                        ],
                    },
                ],
            },
            privacy: {
                id: 'privacy',
                text: mailRouteTitles.privacy,
                to: '/email-privacy',
                icon: 'shield',
                subsections: [
                    {
                        id: 'email-privacy',
                        keywords: [
                            c('Label').t`Auto show remote images`,
                            c('Label').t`Block email tracking`,
                            c('Label').t`Protection mode`,
                        ],
                    },
                ],
            },
            identity: {
                id: 'identity',
                text: mailRouteTitles.identity,
                to: '/identity-addresses',
                icon: 'card-identity',
                subsections: [
                    {
                        text: c('Title').t`Short domain (@pm.me)`,
                        id: 'pmme',
                        available: getShowPmMeSection(user, addresses),
                        keywords: [c('Action').t`Send messages with @pm.me`],
                    },
                    {
                        text: c('Title').t`Display name and signature`,
                        id: 'name-signature',
                        keywords: [
                            c('Label').t`Display name`,
                            c('Label').t`Signature`,
                            c('Label').t`${MAIL_APP_NAME} footer`,
                        ],
                    },
                    {
                        id: 'alias-promotion',
                        keywords: [
                            c('Alias promotion').t`Try ${PASS_APP_NAME}`,
                            c('account_search_index').t`Email aliases`,
                            c('account_search_index').t`Hide my email`,
                        ],
                    },
                    {
                        text: c('Title').t`My addresses`,
                        id: 'addresses',
                        keywords: [
                            c('Action').t`Get more addresses`,
                            c('Action').t`Connect Gmail address`,
                            c('account_search_index').t`Add address`,
                        ],
                    },
                ],
            },
            folder: {
                id: 'folder',
                text: mailRouteTitles.folder,
                to: '/folders-labels',
                icon: 'tags',
                description: c('Settings description')
                    .jt`Keep your inbox organized with folders and labels. ${learnMoreLink}`,
                subsections: [
                    {
                        text: c('Title').t`Folders`,
                        id: 'folderlist',
                        keywords: [
                            c('Action').t`Add folder`,
                            c('Label').t`Use folder colors`,
                            c('Label').t`Inherit color from parent folder`,
                        ],
                    },
                    {
                        text: c('Title').t`Labels`,
                        id: 'labellist',
                        keywords: [
                            c('Action').t`Add label`,
                            c('Action').t`Get more labels`,
                            c('Title').t`Sort labels alphabetically`,
                        ],
                    },
                ],
            },
            filter: {
                id: 'filter',
                text: mailRouteTitles.filter,
                to: '/filters',
                icon: 'filter',
                subsections: [
                    {
                        text: c('Title').t`Custom filters`,
                        id: 'custom',
                        keywords: [
                            c('Action').t`Add filter`,
                            c('Action').t`Add sieve filter`,
                            c('Action').t`Get more filters`,
                        ],
                    },
                    {
                        text: c('Title').t`Spam, block, and allow lists`,
                        id: 'spam',
                        keywords: [
                            c('Action').t`Add address or domain`,
                            c('account_search_index').t`Block sender`,
                            c('account_search_index').t`Allow list`,
                        ],
                    },
                ],
            },
            autoReply: {
                id: 'autoReply',
                text: mailRouteTitles.autoReply,
                to: '/auto-reply',
                icon: 'envelope-arrow-up-and-right',
                subsections: [
                    {
                        text: c('Title').t`Forward emails`,
                        id: 'forward',
                        keywords: [
                            c('email_forwarding_2023: Action').t`Add forwarding rule`,
                            c('email_forwarding_2023: Action').t`Set up email forwarding`,
                            c('account_search_index').t`Redirect incoming emails`,
                        ],
                    },
                    {
                        text: c('Title').t`Auto-reply`,
                        id: 'auto-reply',
                        keywords: [
                            c('account_search_index').t`Out of office`,
                            c('account_search_index').t`Vacation responder`,
                            c('Label').t`Start date`,
                        ],
                    },
                ],
            },
            domainNames: {
                id: 'domainNames',
                text: mailRouteTitles.domainNames,
                to: '/domain-names',
                icon: 'globe',
                // NOTE: This configuration is tied with the organization/routes.tsx domains availability
                available: !user.isMember && !hasOrganizationKey && user.isSelf,
                subsections: [
                    {
                        id: 'domains',
                        keywords: [
                            c('Action').t`Add domain`,
                            c('account_search_index').t`Custom domain`,
                            c('Label in domain modal').t`Verify`,
                        ],
                    },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                        keywords: [
                            c('account_search_index').t`Receive misaddressed emails`,
                            c('account_search_index').t`Catch-all`,
                        ],
                    },
                ],
            },
            keys: {
                id: 'keys',
                text: mailRouteTitles.keys,
                to: '/encryption-keys',
                icon: 'lock',
                subsections: [
                    {
                        text: c('Title').t`Address and key verification`,
                        id: 'address-verification',
                        keywords: [c('Label').t`Prompt to trust keys`, c('Label').t`Verify keys with Key Transparency`],
                    },
                    {
                        text: c('Title').t`External PGP settings`,
                        id: 'pgp-settings',
                        keywords: [
                            c('Label').t`Sign external messages`,
                            c('Label').t`Attach public key`,
                            c('Label').t`Default PGP scheme`,
                        ],
                    },
                    {
                        // title rendering is temporarily handled in the PostQuantumKeysOptInSection
                        text: undefined, // c('Title').t`Post-quantum protection`,
                        id: 'pqc-optin',
                        available: isCryptoPostQuantumOptInEnabled && user.isSelf,
                        keywords: [
                            c('Title').t`Post-quantum protection`,
                            c('Action').t`Enable post-quantum protection`,
                        ],
                    },
                    {
                        text: c('Title').t`Email encryption keys`,
                        id: 'addresses',
                        keywords: [
                            c('Action').t`Reactivate keys`,
                            c('Keys actions').t`Export public key`,
                            c('Action').t`Import key`,
                        ],
                    },
                    {
                        text: c('Title').t`Account keys`,
                        id: 'user',
                        keywords: [
                            c('Action').t`Generate key`,
                            c('Keys actions').t`Export private key`,
                            c('Title header for keys table').t`Fingerprint`,
                        ],
                    },
                ],
            },
            imap: {
                id: 'imap',
                text: mailRouteTitles.imap,
                to: '/imap-smtp',
                icon: 'servers',
                subsections: [
                    {
                        text: c('Title').t`${MAIL_APP_NAME} Bridge`,
                        id: 'protonmail-bridge',
                        keywords: [
                            c('account_search_index').t`IMAP and SMTP`,
                            c('account_search_index').t`Outlook, Apple Mail, and Thunderbird`,
                        ],
                    },
                    {
                        text: c('Title').t`SMTP submission`,
                        id: 'smtp-tokens',
                        keywords: [c('Action').t`Generate token`, c('Header for table').t`Token name`],
                    },
                ],
            },
            backup: {
                id: 'backup',
                text: mailRouteTitles.backup,
                to: '/backup-export',
                icon: 'arrow-up-from-square',
                available: !user.isFree,
                subsections: [
                    {
                        text: c('Title').t`${MAIL_APP_NAME} Export Tool`,
                        id: 'import-export',
                        keywords: [
                            c('Action').t`Download the ${MAIL_APP_NAME} Export Tool`,
                            c('account_search_index').t`Back up emails`,
                            c('account_search_index').t`Export messages`,
                        ],
                    },
                ],
            },
        },
    };
};
