import { Key, UserModel } from '@proton/shared/lib/interfaces';

import { privateKeyA } from '../data';

export const buildUser = (value?: Partial<UserModel>): UserModel => {
    return {
        ID: 'rSUCW_Qlh8dCCsxWKPXvkUsoDNL5eW9FJUM7WX8jTPrDE3ftOMIfWt-BSuKaw5PZ7EQ6Zsp8HL9Y9qMv4Y5XJQ==',
        Name: 'alice',
        Currency: 'EUR',
        Credit: 0,
        Type: 1,
        CreateTime: 1589313678,
        MaxSpace: 7516192768,
        MaxUpload: 26214400,
        UsedSpace: 99993,
        Subscribed: 1,
        Services: 1,
        MnemonicStatus: 4,
        Role: 2,
        Private: 1,
        Delinquent: 0,
        DriveEarlyAccess: 0,
        Idle: 0,
        Keys: [
            {
                ID: '4Xi8TArBe1WYfrFoJF5_wIDF0shMe5ACAqOArU6hjpUNoC0O0c_Zu5Afz11gGU1eeDu5Aanp_EUkpd44kjQ2lg==',
                Version: 3,
                Primary: 1,
                RecoverySecret: null,
                RecoverySecretSignature: null,
                PrivateKey: privateKeyA,
                Fingerprint: '5372de721b9971518273581e04cd9dc25fbae509',
                Active: 1,
            } as Key,
        ],
        ToMigrate: 0,
        Email: 'alice@jomail.com',
        DisplayName: 'alice',
        isAdmin: true,
        isMember: false,
        isFree: false,
        isPaid: true,
        isPrivate: true,
        isSubUser: false,
        isDelinquent: false,
        hasNonDelinquentScope: true,
        hasPaidMail: true,
        hasPaidVpn: false,
        hasPaidDrive: false,
        canPay: true,
        ...value,
    };
};
