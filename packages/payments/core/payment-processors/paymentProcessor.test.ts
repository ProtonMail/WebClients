import type { AmountAndCurrency, ChargeablePaymentParameters, ChargeablePaymentToken } from '../interface';
import { PaymentProcessor } from './paymentProcessor';

interface TestPaymentProcessorState {
    value: string;
}

class PaymentProcessorTest extends PaymentProcessor<TestPaymentProcessorState> {
    fetchPaymentToken(): Promise<ChargeablePaymentToken> {
        throw new Error('Method not implemented.');
    }

    verifyPaymentToken(): Promise<ChargeablePaymentParameters> {
        throw new Error('Method not implemented.');
    }
}

describe('PaymentProcessor', () => {
    let paymentProcessor: PaymentProcessor<TestPaymentProcessorState>;
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'USD',
    };
    const initialState: TestPaymentProcessorState = {
        value: 'initial',
    };
    const mockHandler = jest.fn();

    beforeEach(() => {
        paymentProcessor = new PaymentProcessorTest(initialState, amountAndCurrency);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call the handler when the state is updated', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        const newState = { value: 'updated' };
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
        const newState = { value: 'updated' };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not call the handler when the state is updated after the handler was removed', () => {
        const id = paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(id);
        const newState = { value: 'updated' };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not call the handler when the state is updated after the handler was removed by handler instance', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(mockHandler);
        const newState = { value: 'updated' };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });
});
