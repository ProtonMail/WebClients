export const createOnceHandler = <Argument extends any, ReturnValue extends any>(
    createPromise: (...args: Argument[]) => Promise<ReturnValue>
) => {
    let promise: Promise<ReturnValue> | undefined;

    const clear = () => {
        promise = undefined;
    };

    return (...args: Argument[]): Promise<ReturnValue> => {
        if (promise) {
            return promise;
        }

        promise = createPromise(...args)
            .then((result: ReturnValue) => {
                clear();
                return result;
            })
            .catch((e: any) => {
                clear();
                throw e;
            });
        return promise;
    };
};
