function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}

export default isFunction;
