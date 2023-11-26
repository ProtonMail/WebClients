export const debugChangedDeps = <T extends any[]>(
    dependencies: T,
    previousDeps: T | undefined,
    dependencyNames?: string[],
    logPrefix = ''
) => {
    const changedDeps = dependencies.reduce((accum: object, dependency, index) => {
        if (dependency !== previousDeps?.[index]) {
            const keyName = dependencyNames?.[index] || index;
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps?.[index],
                    after: dependency,
                },
            };
        }

        return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
        console.log(` [${logPrefix}-use-effect-debugger]`, changedDeps);
    }
};
