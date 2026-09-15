import { setOfferedApplePayFlow } from '../core/apple-pay-support';
import { PAYMENT_METHOD_TYPES } from '../core/constants';
import { getTelemetryMethodVariant, getTelemetryPaymentMethod } from './helpers';

const SAVED_METHOD_ID = 'kHMKYDaZLKHWIfCsuwpbNZ0bYZDpQDwRaOKPCGdCmqNCLXiWm5Vf8g==';

const newApplePay = {
    paymentMethodType: PAYMENT_METHOD_TYPES.APPLE_PAY,
    paymentMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY,
};

afterEach(() => setOfferedApplePayFlow(null));

describe('getTelemetryMethodVariant', () => {
    it('reports the flow the availability check settled on', () => {
        setOfferedApplePayFlow('qr');
        expect(getTelemetryMethodVariant(newApplePay)).toBe('apple_pay_qr');

        setOfferedApplePayFlow('native');
        expect(getTelemetryMethodVariant(newApplePay)).toBe('apple_pay_native');
    });

    it('has no variant when no check has recorded a flow, rather than guessing one', () => {
        expect(getTelemetryMethodVariant(newApplePay)).toBeNull();
    });

    it('has no variant for a saved Apple Pay method, which shows no sheet at all', () => {
        setOfferedApplePayFlow('qr');

        expect(
            getTelemetryMethodVariant({
                paymentMethodType: PAYMENT_METHOD_TYPES.APPLE_PAY,
                paymentMethodValue: SAVED_METHOD_ID,
            })
        ).toBeNull();
    });

    it('has no variant for methods other than Apple Pay', () => {
        setOfferedApplePayFlow('qr');

        expect(
            getTelemetryMethodVariant({
                paymentMethodType: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                paymentMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            })
        ).toBeNull();
    });

    it('has no variant when no method is selected yet', () => {
        setOfferedApplePayFlow('native');

        expect(getTelemetryMethodVariant({ paymentMethodType: undefined, paymentMethodValue: undefined })).toBeNull();
    });
});

describe('getTelemetryPaymentMethod', () => {
    it('stays abstract about Apple Pay whichever flow was offered', () => {
        setOfferedApplePayFlow('qr');

        expect(getTelemetryPaymentMethod(newApplePay)).toBe('apple_pay');
        expect(
            getTelemetryPaymentMethod({
                paymentMethodType: PAYMENT_METHOD_TYPES.APPLE_PAY,
                paymentMethodValue: SAVED_METHOD_ID,
            })
        ).toBe('saved_apple_pay');
    });
});
