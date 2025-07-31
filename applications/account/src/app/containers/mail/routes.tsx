import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { SidebarConfig } from '@proton/components';
import { getMailRouteTitles } from '@proton/components/containers/account/constants/settingsRouteTitles';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { ADDRESS_TYPE, APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import { getIsExternalAccount } from '@proton/shared/lib/keys';

export const getHasPmMeAddress = (addresses?: Address[]) => {
    return !!addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
};

export const getShowPmMeSection = (user: UserModel, addresses: Address[] | undefined) => {
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
    isCryptoPostQuantumOptInEnabled,
}: {
    app: APP_NAMES;
    user: UserModel;
    addresses?: Address[];
    organization?: Organization;
    isCryptoPostQuantumOptInEnabled?: boolean;
}): SidebarConfig => {
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/using-folders-labels')}>{c('Link').t`Learn more`}</Href>
    );
    const mailRouteTitles = getMailRouteTitles();
    return {
        available: app === APPS.PROTONMAIL,
        header: MAIL_APP_NAME,
        routes: {
            desktop: {
                text: mailRouteTitles.desktop,
                to: '/get-the-apps',
                icon: 'arrow-down-line',
                subsections: [
                    { id: 'proton-mail-mobile-apps', text: c('Title').t`Download the mobile apps` },
                    { id: 'proton-mail-desktop-apps', text: c('Title').t`Download the desktop app` },
                ],
            },
            general: {
                text: mailRouteTitles.general,
                to: '/general',
                icon: 'envelope',
                subsections: [
                    {
                        text: c('Title').t`General`,
                        id: 'general',
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: 'layout',
                    },
                    {
                        text: c('Title').t`Messages`,
                        id: 'messages',
                    },
                    {
                        text: c('Title').t`Composing`,
                        id: 'composing',
                    },
                    {
                        text: c('Title').t`Other preferences`,
                        id: 'other-preferences',
                    },
                ],
            },
            privacy: {
                text: mailRouteTitles.privacy,
                to: '/email-privacy',
                icon: 'shield',
                subsections: [{ id: 'email-privacy' }],
            },
            identity: {
                text: mailRouteTitles.identity,
                to: '/identity-addresses',
                icon: 'card-identity',
                subsections: [
                    {
                        text: c('Title').t`Short domain (@pm.me)`,
                        id: 'pmme',
                        available: getShowPmMeSection(user, addresses),
                    },
                    {
                        text: c('Title').t`Display name and signature`,
                        id: 'name-signature',
                    },
                    {
                        id: 'alias-promotion',
                    },
                    {
                        text: c('Title').t`My addresses`,
                        id: 'addresses',
                    },
                ],
            },
            folder: {
                text: mailRouteTitles.folder,
                to: '/folders-labels',
                icon: 'tags',
                description: c('Settings description')
                    .jt`Keep your inbox organized with folders and labels. ${learnMoreLink}`,
                subsections: [
                    {
                        text: c('Title').t`Folders`,
                        id: 'folderlist',
                    },
                    {
                        text: c('Title').t`Labels`,
                        id: 'labellist',
                    },
                ],
            },
            filter: {
                text: mailRouteTitles.filter,
                to: '/filters',
                icon: 'filter',
                subsections: [
                    {
                        text: c('Title').t`Custom filters`,
                        id: 'custom',
                    },
                    {
                        text: c('Title').t`Spam, block, and allow lists`,
                        id: 'spam',
                    },
                ],
            },
            autoReply: {
                text: mailRouteTitles.autoReply,
                to: '/auto-reply',
                icon: 'envelope-arrow-up-and-right',
                subsections: [
                    { text: c('Title').t`Forward emails`, id: 'forward' },
                    { text: c('Title').t`Auto-reply`, id: 'auto-reply' },
                ],
            },
            domainNames: {
                text: mailRouteTitles.domainNames,
                to: '/domain-names',
                icon: 'globe',
                // NOTE: This configuration is tied with the organization/routes.tsx domains availability
                available: !user.isMember && !hasOrganizationKey,
                subsections: [
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            keys: {
                text: mailRouteTitles.keys,
                to: '/encryption-keys',
                icon: 'lock',
                subsections: [
                    {
                        text: c('Title').t`Address and key verification`,
                        id: 'address-verification',
                    },
                    {
                        text: c('Title').t`External PGP settings`,
                        id: 'pgp-settings',
                    },
                    {
                        text: c('Title').t`Post-quantum protection`,
                        id: 'pqc-optin',
                        available: isCryptoPostQuantumOptInEnabled,
                    },
                    {
                        text: c('Title').t`Email encryption keys`,
                        id: 'addresses',
                    },
                    {
                        text: c('Title').t`Account keys`,
                        id: 'user',
                    },
                ],
            },
            imap: {
                text: mailRouteTitles.imap,
                to: '/imap-smtp',
                icon: 'servers',
                subsections: [
                    {
                        text: c('Title').t`${MAIL_APP_NAME} Bridge`,
                        id: 'protonmail-bridge',
                    },
                    {
                        text: c('Title').t`SMTP submission`,
                        id: 'smtp-tokens',
                    },
                ],
            },
            backup: {
                text: mailRouteTitles.backup,
                to: '/backup-export',
                icon: 'arrow-up-from-square',
                available: !user.isFree,
                subsections: [
                    {
                        text: c('Title').t`${MAIL_APP_NAME} Export Tool`,
                        id: 'import-export',
                    },
                ],
            },
        },
    };
};
