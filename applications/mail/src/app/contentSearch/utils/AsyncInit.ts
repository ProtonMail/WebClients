export class AsyncInit<T> {
    public readonly promise: Promise<T>;
    private _value?: T;
    private _failed = false;
    constructor(init: () => Promise<T>) {
        this.promise = init().then((value) => (this._value = value));
        this.promise.catch(() => {
            this._failed = true;
            // no need to handle the error here further
            // as this.promise is expected to be awaited
        });
    }

    get value() {
        return this._value;
    }

    get failed() {
        return this._failed;
    }
}
