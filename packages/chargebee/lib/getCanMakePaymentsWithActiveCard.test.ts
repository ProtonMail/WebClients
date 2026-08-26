import { getCanMakePaymentsWithActiveCard } from './getCanMakePaymentsWithActiveCard';

const setApplePaySession = (session: any) => {
    (window as any).ApplePaySession = session;
};

describe('getCanMakePaymentsWithActiveCard', () => {
    afterEach(() => {
        delete (window as any).ApplePaySession;
    });

    it('reports unavailable without ApplePaySession', async () => {
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(false);
    });

    it('reports unavailable where canMakePaymentsWithActiveCard is absent, as outside Safari', async () => {
        setApplePaySession({ canMakePayments: () => true });
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(false);
    });

    it('reports available with an active card', async () => {
        setApplePaySession({
            canMakePayments: () => true,
            canMakePaymentsWithActiveCard: async () => true,
        });
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(true);
    });

    it('reports unavailable without an active card', async () => {
        setApplePaySession({
            canMakePayments: () => true,
            canMakePaymentsWithActiveCard: async () => false,
        });
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(false);
    });

    it('reports unavailable when the device cannot pay', async () => {
        setApplePaySession({
            canMakePayments: () => false,
            canMakePaymentsWithActiveCard: async () => true,
        });
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(false);
    });

    it('reports unavailable when the session throws', async () => {
        setApplePaySession({
            canMakePayments: () => {
                throw new Error('nope');
            },
            canMakePaymentsWithActiveCard: async () => true,
        });
        await expect(getCanMakePaymentsWithActiveCard()).resolves.toBe(false);
    });

    it('passes the current hostname in the merchant identifier', async () => {
        const canMakePaymentsWithActiveCard = jest.fn().mockResolvedValue(true);
        setApplePaySession({ canMakePayments: () => true, canMakePaymentsWithActiveCard });

        await getCanMakePaymentsWithActiveCard();

        expect(canMakePaymentsWithActiveCard).toHaveBeenCalledWith(
            `merchant.${window.location.hostname}.acct_15kbbgKpW9DKy5hn.stripe`
        );
    });
});
