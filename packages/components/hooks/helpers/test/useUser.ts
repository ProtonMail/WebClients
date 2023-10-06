import { getUser } from '@proton/shared/lib/api/user';
import { UserModel } from '@proton/shared/lib/models';
import { formatUser } from '@proton/shared/lib/models/userModel';
import { addApiMock, addToCache } from '@proton/testing';

export const userDefaultResponse = {
    Code: 1000,
    User: {
        ID: 'UtjmZQ61KXXx9IaKWEuWF1fMVraFABonV3pY5s9KiYcICgLf75vxuemuLrTVBPX0jSKAtSNO39HEJh4_gmAWmg==',
        Name: 'proton154',
        Currency: 'CHF',
        Credit: 0,
        Type: 1,
        CreateTime: 1675856278,
        MaxSpace: 536870912000,
        MaxUpload: 26214400,
        UsedSpace: 464014,
        Subscribed: 7,
        Services: 7,
        MnemonicStatus: 1,
        Role: 2,
        Private: 1,
        Delinquent: 0,
        Keys: [],
        ToMigrate: 0,
        Email: 'proton154@proton.black',
        DisplayName: 'proton154',
    },
};

export function mockUserApi() {
    addApiMock(getUser().url, () => userDefaultResponse);
}

export function mockUserCache(user = formatUser(userDefaultResponse.User)) {
    addToCache(UserModel.key, user);
}
