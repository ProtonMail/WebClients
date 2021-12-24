import { c } from 'ttag';

import {
    AddressVerificationSection,
    ExternalPGPSettingsSection,
    AddressKeysSection,
    UserKeysSection,
    SettingsPropsShared,
} from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getEncryptionKeysPage = () => {
    return {
        text: c('Title').t`Encryption and keys`,
        to: '/mail/encryption-keys',
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
    };
};

const MailEncryptionKeysSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getEncryptionKeysPage()}>
            <AddressVerificationSection />
            <ExternalPGPSettingsSection />
            <AddressKeysSection />
            <UserKeysSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailEncryptionKeysSettings;
