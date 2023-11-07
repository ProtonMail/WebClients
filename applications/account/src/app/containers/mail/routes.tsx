import { c } from 'ttag';

import Href from '@proton/atoms/Href/Href';
import { SidebarConfig } from '@proton/components';
import { ADDRESS_TYPE, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, Organization, UserModel, UserType } from '@proton/shared/lib/interfaces';

export const getHasPmMeAddress = (addresses: Address[]) => {
    return addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
};

export const getShowPmMeSection = (user: UserModel, addresses: Address[] = []) => {
    const { hasPaidMail, canPay, Type } = user;
    const isExternalUser = Type === UserType.EXTERNAL;
    const isPMAddressActive = getHasPmMeAddress(addresses);
    const hasNoOriginalAddresses = !addresses.some((address) => address.Type === ADDRESS_TYPE.TYPE_ORIGINAL);
    return !isExternalUser && canPay && !hasNoOriginalAddresses && !(isPMAddressActive && hasPaidMail);
};

export const getMailAppRoutes = ({
    user,
    addresses,
    organization,
    isSmtpTokenEnabled,
    isEmailForwardingEnabled,
}: {
    user: UserModel;
    addresses: Address[];
    organization: Organization;
    isSmtpTokenEnabled: boolean;
    isEmailForwardingEnabled: boolean;
}): SidebarConfig => {
    const hasOrganization = !!organization?.HasKeys;
    const learnMoreLink = <Href href={getKnowledgeBaseUrl('/using-folders-labels')}>{c('Link').t`Learn more`}</Href>;
    return {
        header: MAIL_APP_NAME,
        routes: {
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
                text: isEmailForwardingEnabled ? c('Title').t`Forward and Auto-reply` : c('Title').t`Auto-reply`,
                to: '/auto-reply',
                icon: 'envelope-arrow-up-and-right',
                subsections: [
                    { text: c('Title').t`Forward emails`, id: 'forward', available: isEmailForwardingEnabled },
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
                        available: isSmtpTokenEnabled,
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
                        text: c('Title').t`Import-Export app`,
                        id: 'import-export',
                    },
                ],
            },
        },
    };
};
