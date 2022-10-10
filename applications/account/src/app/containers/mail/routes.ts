import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import { Address, Organization, UserModel, UserType } from '@proton/shared/lib/interfaces';
import { ADDRESS_TYPE, MAIL_APP_NAME } from '@proton/shared/lib/constants';

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
    isSpyTrackerEnabled,
    isShowSenderImagesEnabled,
}: {
    user: UserModel;
    addresses: Address[];
    organization: Organization;
    isSpyTrackerEnabled: boolean;
    isShowSenderImagesEnabled: boolean;
}) => {
    const hasOrganization = !!organization?.HasKeys;
    return <const>{
        header: MAIL_APP_NAME,
        routes: {
            general: <SectionConfig>{
                text: c('Title').t`Messages and composing`,
                to: '/general',
                icon: 'grid-2',
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
                        text: c('Title').t`Messages`,
                        id: 'messages',
                    },
                    {
                        text: c('Title').t`Composing`,
                        id: 'composing',
                    },
                ],
            },
            privacy: <SectionConfig>{
                text: c('Title').t`Email privacy`,
                to: '/email-privacy',
                icon: 'shield',
                available: isSpyTrackerEnabled,
                subsections: [{ id: 'email-privacy' }],
            },
            identity: <SectionConfig>{
                text: c('Title').t`Identity and addresses`,
                to: '/identity-addresses',
                icon: 'card-identity',
                subsections: [
                    {
                        text: c('Title').t`Display name and signature`,
                        id: 'name-signature',
                    },
                    {
                        text: c('Title').t`My addresses`,
                        id: 'addresses',
                    },
                ],
            },
            appearance: <SectionConfig>{
                text: c('Title').t`Appearance`,
                to: '/appearance',
                icon: 'paint-roller',
                subsections: [
                    {
                        text: c('Title').t`Theme`,
                        id: 'theme',
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: 'layout',
                    },
                    isShowSenderImagesEnabled && {
                        text: c('Title').t`Sender image`,
                        id: 'sender-image',
                    },
                ],
            },
            folder: <SectionConfig>{
                text: c('Title').t`Folders and labels`,
                to: '/folders-labels',
                icon: 'tags',
                description: c('Settings description')
                    .t`You can apply multiple labels to a single message, but messages can usually only be in a single folder. Drag and drop to rearrange the order of your folders and labels.`,
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
            filter: <SectionConfig>{
                text: c('Title').t`Filters`,
                to: '/filters',
                icon: 'filter',
                subsections: [
                    {
                        text: c('Title').t`Custom filters`,
                        id: 'custom',
                    },
                    {
                        text: c('Title').t`Spam and block list`,
                        id: 'spam',
                    },
                ],
            },
            autoReply: <SectionConfig>{
                text: c('Title').t`Auto-reply`,
                to: '/auto-reply',
                icon: 'envelope-arrow-up-and-right',
                subsections: [{ id: 'auto-reply' }],
            },
            domainNames: <SectionConfig>{
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
            keys: <SectionConfig>{
                text: c('Title').t`Encryption and keys`,
                to: '/encryption-keys',
                icon: 'lock-filled',
                subsections: [
                    {
                        text: c('Title').t`Address verification`,
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
                        text: c('Title').t`Contact encryption keys`,
                        id: 'user',
                    },
                ],
            },
            imap: <SectionConfig>{
                text: c('Title').t`IMAP/SMTP`,
                to: '/imap-smtp',
                icon: 'servers',
                subsections: [
                    {
                        text: c('Title').t`${MAIL_APP_NAME} Bridge`,
                        id: 'protonmail-bridge',
                    },
                ],
            },
            backup: <SectionConfig>{
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
