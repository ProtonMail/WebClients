export const throwError = (options: { name?: string; message?: string }) => {
    const error = new Error(options.message);
    error.name = options.name ?? error.name;
    throw error;
};
