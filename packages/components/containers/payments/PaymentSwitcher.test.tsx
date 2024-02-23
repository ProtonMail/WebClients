import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { isChargebeeEnabledInner } from './PaymentSwitcher';

describe('isChargebeeEnabledInner', () => {
    const mockGetUser = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns INHOUSE_FORCED when user is logged in and chargebeeUser is CHARGEBEE_ALLOWED and chargebeeFreeToPaidUpgradeFlag is false', async () => {
        mockGetUser.mockResolvedValue({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED });
        const result = await isChargebeeEnabledInner('UID', mockGetUser, false, false, false);
        expect(result).toEqual(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it.each([ChargebeeEnabled.CHARGEBEE_ALLOWED, ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeEnabled.INHOUSE_FORCED])(
        'returns chargebeeUser when user is logged in %s',
        async (ChargebeeUser) => {
            mockGetUser.mockResolvedValue({ ChargebeeUser });
            const result = await isChargebeeEnabledInner('UID', mockGetUser, false, true, false);
            expect(result).toEqual(ChargebeeUser);
        }
    );

    it('returns INHOUSE_FORCED when user is not logged in and chargebeeSignupsFlag is false', async () => {
        const result = await isChargebeeEnabledInner(undefined, mockGetUser, false, false, false);
        expect(result).toEqual(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it('returns CHARGEBEE_ALLOWED when user is not logged in and chargebeeSignupsFlag is true', async () => {
        const result = await isChargebeeEnabledInner(undefined, mockGetUser, true, false, false);
        expect(result).toEqual(ChargebeeEnabled.CHARGEBEE_ALLOWED);
    });

    it('returns CHARGEBEE_FORCED when user is logged in and ChargebeeUser is CHARGEBEE_FORCED', async () => {
        mockGetUser.mockResolvedValue({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED });
        const result = await isChargebeeEnabledInner('UID', mockGetUser, false, false, false);
        expect(result).toEqual(ChargebeeEnabled.CHARGEBEE_FORCED);
    });

    it('returns INHOUSE_FORCED when user is logged in and ChargebeeUser is INHOUSE_FORCED', async () => {
        mockGetUser.mockResolvedValue({ ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED });
        const result = await isChargebeeEnabledInner('UID', mockGetUser, false, false, false);
        expect(result).toEqual(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it('returns INHOUSE_FORCED when user is logged in and isAccountLite is true', async () => {
        mockGetUser.mockResolvedValue({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED });
        const result = await isChargebeeEnabledInner('UID', mockGetUser, false, false, true);
        expect(result).toEqual(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it('returns INHOUSE_FORCED when user is not logged in and isAccountLite is true', async () => {
        const result = await isChargebeeEnabledInner(undefined, mockGetUser, false, false, true);
        expect(result).toEqual(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it('returns CHARGEBEE_FORCED when user is CHARGEBEE_FORCED and the app is AccountLite', async () => {
        mockGetUser.mockResolvedValue({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED });
        const result = await isChargebeeEnabledInner('UID', mockGetUser, false, false, true);
        expect(result).toEqual(ChargebeeEnabled.CHARGEBEE_FORCED);
    });
});
