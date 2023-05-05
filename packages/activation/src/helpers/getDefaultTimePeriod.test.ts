import { USER_ROLES } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS, UserModel, UserType } from '@proton/shared/lib/interfaces';

import { TIME_PERIOD } from '../interface';
import { getDefaultTimePeriod } from './getDefaultTimePeriod';

describe('get getDefault time period', () => {
    it('Should return 3 month for free users', () => {
        const user: UserModel = {
            isAdmin: false,
            isMember: false,
            isFree: true,
            isPaid: false,
            isPrivate: false,
            isSubUser: false,
            isDelinquent: false,
            hasNonDelinquentScope: false,
            hasPaidMail: false,
            hasPaidVpn: false,
            hasPaidDrive: false,
            canPay: false,
            ID: '',
            Name: '',
            UsedSpace: 0,
            Currency: 'EUR',
            Credit: 0,
            MaxSpace: 0,
            MaxUpload: 0,
            Role: USER_ROLES.FREE_ROLE,
            Private: 0,
            Type: UserType.EXTERNAL,
            Subscribed: 0,
            Services: 0,
            Delinquent: 0,
            Email: '',
            DisplayName: '',
            Keys: [],
            DriveEarlyAccess: 0,
            ToMigrate: 0,
            MnemonicStatus: MNEMONIC_STATUS.ENABLED,
            Idle: 0,
            CreateTime: 0,
        };

        const timePeriod = getDefaultTimePeriod(user);
        expect(timePeriod).toBe(TIME_PERIOD.LAST_3_MONTHS);
    });

    it('Should return big bang for free users', () => {
        const user: UserModel = {
            isAdmin: false,
            isMember: false,
            isFree: false,
            isPaid: false,
            isPrivate: false,
            isSubUser: false,
            isDelinquent: false,
            hasNonDelinquentScope: false,
            hasPaidMail: true,
            hasPaidVpn: false,
            hasPaidDrive: false,
            canPay: false,
            ID: '',
            Name: '',
            UsedSpace: 0,
            Currency: 'EUR',
            Credit: 0,
            MaxSpace: 0,
            MaxUpload: 0,
            Role: USER_ROLES.FREE_ROLE,
            Private: 0,
            Type: UserType.EXTERNAL,
            Subscribed: 0,
            Services: 0,
            Delinquent: 0,
            Email: '',
            DisplayName: '',
            Keys: [],
            DriveEarlyAccess: 0,
            ToMigrate: 0,
            MnemonicStatus: MNEMONIC_STATUS.ENABLED,
            Idle: 0,
            CreateTime: 0,
        };

        const timePeriod = getDefaultTimePeriod(user);
        expect(timePeriod).toBe(TIME_PERIOD.BIG_BANG);
    });
});
