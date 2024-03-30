type ErrorOptions = { name?: string; message?: string };

export const error = (options: ErrorOptions): Error => {
    const error = new Error(options.message);
    error.name = options.name ?? error.name;
    return error;
};

export const throwError = (options: ErrorOptions) => {
    throw error(options);
};
