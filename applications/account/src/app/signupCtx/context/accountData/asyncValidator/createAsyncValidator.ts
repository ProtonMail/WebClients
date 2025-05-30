import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export enum AsyncValidationStateValue {
    Idle,
    Loading,
    Success,
    Error,
    Fatal,
}

export interface AsyncValidationState {
    state: AsyncValidationStateValue;
    value: string;
    message: string;
    error?: any;
}

type AsyncValidator = (value: string, abortController: AbortController) => Promise<AsyncValidationState>;

export const createAsyncValidator = () => {
    let state: AsyncValidationStateValue = AsyncValidationStateValue.Idle;
    let lastKey: string | undefined = undefined;
    let abortController: AbortController;
    type Setter = (data: AsyncValidationState) => void;

    const cache: { [key: string]: AsyncValidationState } = {};
    const pendingResolves: (() => void)[] = [];

    const setState = (set: Setter, args: AsyncValidationState) => {
        state = args.state;
        set(args);

        if (state !== AsyncValidationStateValue.Loading) {
            pendingResolves.forEach((resolve) => resolve());
            pendingResolves.length = 0;
        }
    };

    const validator = debounce(
        ({ validate, value, key, set }: { validate: AsyncValidator; value: string; key: string; set: Setter }) => {
            abortController?.abort('stale');

            if (lastKey !== key) {
                return;
            }

            const cachedValue = cache[key];
            if (cachedValue) {
                setState(set, cachedValue);
                return;
            }

            abortController = new AbortController();

            validate(value, abortController)
                .then((result) => {
                    if (
                        result.state === AsyncValidationStateValue.Success ||
                        result.state === AsyncValidationStateValue.Fatal
                    ) {
                        cache[key] = result;
                    }

                    if (lastKey === key) {
                        setState(set, result);
                    }
                })
                .catch(noop);
        },
        300
    );
    return {
        pending: async () => {
            // On loading state, it'll wait until the state changes to something else
            if (state === AsyncValidationStateValue.Loading) {
                return new Promise<void>((resolve) => {
                    pendingResolves.push(resolve);
                });
            }
            // Otherwise nothing is happening and it can resolve immediately
        },
        trigger: ({
            value,
            key,
            validate,
            error,
            set,
        }: {
            error: boolean;
            key: string;
            value: string;
            validate: AsyncValidator;
            set: Setter;
        }) => {
            lastKey = key;

            if (error) {
                setState(set, { state: AsyncValidationStateValue.Idle, value, message: '' });
                abortController?.abort('error');
                validator.cancel();
                return;
            }

            const cachedValue = cache[key];
            if (cachedValue) {
                setState(set, cachedValue);
                return;
            }

            setState(set, { state: AsyncValidationStateValue.Loading, value, message: '' });
            validator({ validate, value, key, set });
        },
    };
};

export const defaultAsyncValidationState: AsyncValidationState = {
    state: AsyncValidationStateValue.Idle,
    value: '',
    message: '',
};
