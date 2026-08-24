import { getApplePayCapabilities } from './getApplePayCapabilities';
import { loadApplePaySdk } from './loadApplePaySdk';

jest.mock('./loadApplePaySdk', () => ({ loadApplePaySdk: jest.fn(async () => {}) }));

const setApplePaySession = ({
    canMakePayments = true,
    paymentCredentialStatus,
    canMakePaymentsWithActiveCard,
}: {
    canMakePayments?: boolean;
    paymentCredentialStatus?: string;
    canMakePaymentsWithActiveCard?: boolean;
}) => {
    (window as any).ApplePaySession = {
        canMakePayments: () => canMakePayments,
        applePayCapabilities:
            paymentCredentialStatus === undefined ? undefined : async () => ({ paymentCredentialStatus }),
        canMakePaymentsWithActiveCard:
            canMakePaymentsWithActiveCard === undefined ? undefined : async () => canMakePaymentsWithActiveCard,
    };
};

describe('getApplePayCapabilities', () => {
    afterEach(() => {
        delete (window as any).ApplePaySession;
    });

    it("reports unavailable without ApplePaySession, as when Apple's SDK fails to load", async () => {
        await expect(getApplePayCapabilities()).resolves.toBe(false);
    });

    it("loads Apple's SDK first, as it is what defines ApplePaySession outside Safari", async () => {
        jest.mocked(loadApplePaySdk).mockImplementationOnce(async () =>
            setApplePaySession({ paymentCredentialStatus: 'paymentCredentialsAvailable' })
        );

        await expect(getApplePayCapabilities()).resolves.toBe(true);
    });

    describe('with ApplePaySession', () => {
        it('reports unavailable when the device cannot pay', async () => {
            setApplePaySession({ canMakePayments: false, paymentCredentialStatus: 'paymentCredentialsAvailable' });
            await expect(getApplePayCapabilities()).resolves.toBe(false);
        });

        it.each(['applePayUnsupported', 'paymentCredentialsUnavailable'])(
            'reports unavailable for %s, where the button would have nothing behind it',
            async (paymentCredentialStatus) => {
                setApplePaySession({ paymentCredentialStatus });
                await expect(getApplePayCapabilities()).resolves.toBe(false);
            }
        );

        it.each(['paymentCredentialsAvailable', 'paymentCredentialStatusUnknown'])(
            'reports available for %s',
            async (paymentCredentialStatus) => {
                setApplePaySession({ paymentCredentialStatus });
                await expect(getApplePayCapabilities()).resolves.toBe(true);
            }
        );

        it('reports unavailable when the session throws', async () => {
            (window as any).ApplePaySession = {
                canMakePayments: () => {
                    throw new Error('nope');
                },
            };
            await expect(getApplePayCapabilities()).resolves.toBe(false);
        });
    });

    describe('without applePayCapabilities, as without the Apple Pay JS SDK', () => {
        it('defers to the active card check', async () => {
            setApplePaySession({ canMakePaymentsWithActiveCard: true });
            await expect(getApplePayCapabilities()).resolves.toBe(true);
        });

        it('reports unavailable with no active card', async () => {
            setApplePaySession({ canMakePaymentsWithActiveCard: false });
            await expect(getApplePayCapabilities()).resolves.toBe(false);
        });
    });
});
