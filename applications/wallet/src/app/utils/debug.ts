import { useEffect, useRef } from 'react';

const usePrevious = (value: any, initialValue: any) => {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

export const useEffectDebugger = (effectHook: (...args: any[]) => any, dependencies: any[], dependencyNames = []) => {
    const previousDeps = usePrevious(dependencies, []);

    const changedDeps = dependencies.reduce((accum, dependency, index) => {
        if (dependency !== previousDeps[index]) {
            const keyName = dependencyNames[index] || index;
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps[index],
                    after: dependency,
                },
            };
        }

        return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
        // eslint-disable-next-line no-console
        console.log('[use-effect-debugger] ', changedDeps);
    }

    useEffect(effectHook, dependencies);
};
