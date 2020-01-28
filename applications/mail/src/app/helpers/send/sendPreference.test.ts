import { getSendPreferences } from './sendPreferences';
import { RECIPIENT_TYPE } from 'proton-shared/lib/constants';
import { Address } from '../../models/address';
import { ContactEmail } from '../../models/contact';
import { KeyData, Key } from '../../models/key';

const ownEmail = 'own@test.com';
const email1 = 'test1@test.com';
const email2 = 'test2@test.com';
const email3 = 'test3@test.com';
const i = 4;
const emailCacheBuster = () => `test${i}@test.com`;
const message = {};
const mailSettings = {};
const ownAddress = { ID: 'own', Email: ownEmail, DisplayName: 'Own', Receive: 1 };
const addresses: Address[] = [ownAddress];
const contactCache = new Map<string, ContactEmail>();
const getPublicKeys = jest.fn(async () => ({} as KeyData));

describe('sendPreference', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const setup = async ({ emails = [emailCacheBuster()] } = {}) => {
        return getSendPreferences(emails, message, mailSettings, addresses, contactCache, getPublicKeys, false);
    };

    describe('result structure', () => {
        it('should return an empty object if no email', async () => {
            const result = await setup({ emails: [] });
            expect(Object.values(result).length).toBe(0);
        });

        it('should return one preference if one email', async () => {
            const result = await setup({ emails: [email1] });
            expect(Object.values(result).length).toBe(1);
            expect(result[email1]).toBeDefined();
        });

        it('should return as many preferences as emails count', async () => {
            const emails = [email1, email2, email3];
            const result = await setup({ emails });
            expect(Object.values(result).length).toBe(3);
            emails.forEach((email) => expect(result[email]).toBeDefined());
        });
    });

    describe('default', () => {
        it('should match default preferences', async () => {
            const result = await setup({ emails: [email1] });
            expect(result).toMatchSnapshot();
        });
    });

    describe('encrypt', () => {
        it('should not be encrypted by default', async () => {
            const result = await setup();
            expect(Object.values(result)[0].encrypt).toBe(false);
        });

        it('should be encrypted if internal', async () => {
            getPublicKeys.mockImplementation(
                async () =>
                    ({
                        RecipientType: RECIPIENT_TYPE.TYPE_INTERNAL,
                        Keys: [{}] as Key[]
                    } as KeyData)
            );

            const result = await setup();
            expect(Object.values(result)[0].encrypt).toBe(true);
        });

        it('should be encrypted if external', async () => {
            getPublicKeys.mockImplementation(
                async () =>
                    ({
                        RecipientType: RECIPIENT_TYPE.TYPE_EXTERNAL,
                        Keys: [{}] as Key[]
                    } as KeyData)
            );

            const result = await setup();
            expect(Object.values(result)[0].encrypt).toBe(true);
        });
    });

    describe('ownAddress', () => {
        it('should not be ownAddress by default', async () => {
            const result = await setup();
            expect(Object.values(result)[0].ownAddress).toBe(false);
        });

        it('should detect if its sent to a own address', async () => {
            const result = await setup({ emails: [ownEmail] });
            expect(Object.values(result)[0].ownAddress).toBe(true);
        });
    });
});
