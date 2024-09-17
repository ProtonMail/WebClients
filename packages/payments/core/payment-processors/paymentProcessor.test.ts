import { type CardModel, getDefaultCard } from '../cardDetails';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
} from '../interface';
import { PaymentProcessor } from './paymentProcessor';

class PaymentProcessorTest extends PaymentProcessor<{ card: CardModel }> {
    fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> {
        throw new Error('Method not implemented.');
    }

    verifyPaymentToken(): Promise<ChargeablePaymentParameters> {
        throw new Error('Method not implemented.');
    }
}

describe('PaymentProcessor', () => {
    let paymentProcessor: PaymentProcessor<{ card: CardModel }>;
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'USD',
    };
    const mockHandler = jest.fn();

    beforeEach(() => {
        paymentProcessor = new PaymentProcessorTest({ card: getDefaultCard() }, amountAndCurrency);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call the handler when the state is updated', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        const newState = { card: { ...getDefaultCard(), number: '4242424242424242' } };
        paymentProcessor.updateState(newState);
        expect(mockHandler).toHaveBeenCalledWith(newState);
    });

    it('should return an id when a new handler is added', () => {
        const id = paymentProcessor.onStateUpdated(mockHandler);
        expect(typeof id).toEqual('string');
    });

    it('should not call the handler when the state is updated after the processor was destroyed', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.destroy();
        const newState = { card: { ...getDefaultCard(), number: '4242424242424242' } };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not call the handler when the state is updated after the handler was removed', () => {
        const id = paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(id);
        const newState = { card: { ...getDefaultCard(), number: '4242424242424242' } };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not call the handler when the state is updated after the handler was removed by handler instance', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(mockHandler);
        const newState = { card: { ...getDefaultCard(), number: '4242424242424242' } };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });
});
