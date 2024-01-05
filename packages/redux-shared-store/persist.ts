import isTruthy from '@proton/utils/isTruthy';

export const getPersistedState = <T extends object, K extends keyof T>(
    state: T,
    persistReducer: Partial<{ [key in K]: (value: any) => any }>
) => {
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(state)
                .map(([key, value]) => {
                    const transformedValue = persistReducer[key as keyof typeof persistReducer]?.(value);
                    return transformedValue ? [key, transformedValue] : undefined;
                })
                .filter(isTruthy)
        )
    );
};
