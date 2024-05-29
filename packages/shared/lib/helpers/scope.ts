export const hasScope = (scope: string, mask: number | string) => {
    const scopeInt = BigInt(scope);
    const maskInt = BigInt(mask);

    return (scopeInt & maskInt) === maskInt;
};
