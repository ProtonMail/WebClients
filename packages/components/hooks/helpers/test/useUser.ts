import { getUser } from '@proton/shared/lib/api/user';
import { UserModel } from '@proton/shared/lib/models';
import { formatUser } from '@proton/shared/lib/models/userModel';
import { addApiMock, addToCache } from '@proton/testing';

const userDefaultResponse = {
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
        Keys: [
            {
                ID: 'VyOu8dJFIW3Gwja2zPnOMPv3HJi4DMgu5Y7OFHYX2-yCE2gI2iNwEBIRs53kkUSunYLQbsN1CYr5SaWX2NM6QA==',
                Version: 3,
                Primary: 1,
                RecoverySecret: 'LY1jHdyS5H31uscylnBSPhceRGy80EBQqXoVbAcIFOI=',
                RecoverySecretSignature:
                    '-----BEGIN PGP SIGNATURE-----\nVersion: ProtonMail\n\nwnUEARYKACcFAmPjipkJED+xLzhLtLc+FiEEDRTuA1rCJc1UPXbMP7EvOEu0\ntz4AABoQAQDp1AI+xNPpt+MkxzhwznhKHhlqt+h/HRq7tcR0HGnPLQD/aO70\nUEP/t8za6JVedgNz27uC6JmN+IbQ1yREMuuiiwg=\n=hRI+\n-----END PGP SIGNATURE-----\n',
                PrivateKey:
                    '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\nxYYEY+OKWBYJKwYBBAHaRw8BAQdA6hN4OGIJ8cysIAQr0qI7PGitLIHWkWWe\n2sajNzKpwO7+CQMIYzF6xoLOujhgvO0hbo7Mnsb9eeTKSMaDOmBI3bgrS9m2\niMso3TfEgh6wf6m4oF/v+fDQBgUtlQbGeJZ6wis6o9FakY6VSKJ6mV10gWxB\ne807bm90X2Zvcl9lbWFpbF91c2VAZG9tYWluLnRsZCA8bm90X2Zvcl9lbWFp\nbF91c2VAZG9tYWluLnRsZD7CjAQQFgoAPgUCY+OKWAQLCQcICRA/sS84S7S3\nPgMVCAoEFgACAQIZAQIbAwIeARYhBA0U7gNawiXNVD12zD+xLzhLtLc+AACm\npgD/auHmvjKIWWXFfxakX7dT3tHFD5I1l+qsogdBj8bt8DcA/iMvnR1yTaT3\nt2JsEVOzEF54bvROCt2yUQoBSwfBm38Dx4sEY+OKWBIKKwYBBAGXVQEFAQEH\nQKnBCqr9XSsZfFdb1LiLtGN3EznGCfrrwqrtcVgQFwZIAwEIB/4JAwigxmYg\n0OJx9mBeFUbZtTj2ncQdwzvKfW0C0j3gYT6NjXwai+kZbSO7nrTTuggZec0k\ngRzHuoLY59IUxroQbpjMzMJXfm/KTTHE6d5SuJvgwngEGBYIACoFAmPjilgJ\nED+xLzhLtLc+AhsMFiEEDRTuA1rCJc1UPXbMP7EvOEu0tz4AADi8APsEziE2\nifdCFQZyGFNc3xbbguFyAWGB3UKWsKSTMp47ywD/bZFOayZtFbbIOHRDOuGK\nMk9bDrcx+UpCi5bAxLRq1QE=\n=RrlF\n-----END PGP PRIVATE KEY BLOCK-----\n',
                Fingerprint: '0d14ee035ac225cd543d76cc3fb12f384bb4b73e',
                Active: 1,
            },
        ],
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
