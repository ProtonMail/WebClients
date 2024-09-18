import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { SidebarConfig } from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { ADDRESS_TYPE, APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
}: {
    app: APP_NAMES;
    user: UserModel;
    addresses?: Address[];
    organization?: Organization;
}): SidebarConfig => {
    const hasOrganization = !!organization?.HasKeys;
    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/using-folders-labels')}>{c('Link').t`Learn more`}</Href>
    );
    return {
        available: app === APPS.PROTONMAIL,
        header: MAIL_APP_NAME,
        routes: {
            desktop: {
                text: c('Title').t`Get the apps`,
                to: '/get-the-apps',
                icon: 'arrow-down-line',
                subsections: [
                    { id: 'proton-mail-mobile-apps', text: c('Title').t`Download the mobile apps` },
                    { id: 'proton-mail-desktop-apps', text: c('Title').t`Download the desktop app` },
                ],
            },
            general: {
                text: c('Title').t`Messages and composing`,
                to: '/general',
                icon: 'envelope',
                subsections: [
                    {
                        text: c('Title').t`Short domain (@pm.me)`,
                        id: 'pmme',
                        available: getShowPmMeSection(user, addresses),
                    },
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
                text: c('Title').t`Email privacy`,
                to: '/email-privacy',
                icon: 'shield',
                subsections: [{ id: 'email-privacy' }],
            },
            identity: {
                text: c('Title').t`Identity and addresses`,
                to: '/identity-addresses',
                icon: 'card-identity',
                subsections: [
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
                text: c('Title').t`Folders and labels`,
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
                text: c('Title').t`Filters`,
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
                text: c('Title').t`Forward and auto-reply`,
                to: '/auto-reply',
                icon: 'envelope-arrow-up-and-right',
                subsections: [
                    { text: c('Title').t`Forward emails`, id: 'forward' },
                    { text: c('Title').t`Auto-reply`, id: 'auto-reply' },
                ],
            },
            domainNames: {
                text: c('Title').t`Domain names`,
                to: '/domain-names',
                icon: 'globe',
                available: !user.isMember && !hasOrganization,
                subsections: [
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            keys: {
                text: c('Title').t`Encryption and keys`,
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
                text: c('Title').t`IMAP/SMTP`,
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
                text: c('Title').t`Backup and export`,
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
