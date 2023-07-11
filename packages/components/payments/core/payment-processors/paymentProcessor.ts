import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargeablePaymentToken,
    NonChargeablePaymentToken,
} from '../interface';

type UpdateHandler<T> = (stateDiff: Partial<T>) => void;

export class InvalidDataError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidDataError';
    }
}

export abstract class PaymentProcessor<T = any> {
    private updatedHandlers: {
        id: string;
        handler: UpdateHandler<T>;
    }[] = [];

    constructor(protected state: T, public amountAndCurrency: AmountAndCurrency) {}

    abstract fetchPaymentToken(): Promise<ChargeablePaymentToken | NonChargeablePaymentToken>;

    abstract verifyPaymentToken(): Promise<ChargeablePaymentParameters>;

    updateState(state: Partial<T>) {
        this.state = { ...this.state, ...state };
        for (const { handler } of this.updatedHandlers) {
            handler(state);
        }
    }

    onStateUpdated(handler: UpdateHandler<T>, { initial = false } = {}) {
        const id = Math.random().toString(36).slice(2, 11);

        this.updatedHandlers.push({
            id,
            handler,
        });

        if (initial) {
            handler(this.state);
        }

        return id;
    }

    destroy() {
        this.clearHandlers();
    }

    clearHandlers() {
        this.updatedHandlers = [];
    }

    removeHandler(idOrHandler: string | UpdateHandler<T>) {
        if (typeof idOrHandler === 'string') {
            this.updatedHandlers = this.updatedHandlers.filter(({ id }) => id !== idOrHandler);
        } else {
            this.updatedHandlers = this.updatedHandlers.filter(({ handler }) => handler !== idOrHandler);
        }
    }
}
