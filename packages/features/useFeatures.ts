import { useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from '@proton/redux-shared-store';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import type { Feature, FeatureCode } from './interface';
import { fetchFeatures, isValidFeature, selectFeatures, updateFeature } from './reducer';

let codeQueue: FeatureCode[] = [];

export interface FeatureContextValue<V = any> {
    feature: Feature<V> | undefined;
    loading: boolean | undefined;
    get: () => Promise<Feature<V>>;
    update: (value: V) => Promise<Feature<V>>;
    code: FeatureCode;
}

const useFeatures = <Flags extends FeatureCode>(codes: Flags[], prefetch = true) => {
    const dispatch = useDispatch();
    const state = useSelector(selectFeatures);

    const get = useCallback((codes: FeatureCode[]) => {
        const oldCodeQueue = codeQueue;
        codeQueue = [];
        return dispatch(fetchFeatures(unique(codes.concat(oldCodeQueue))));
    }, []);

    const put = async (code: FeatureCode, value: any) => {
        return dispatch(updateFeature(code, value));
    };

    const enqueue = (codes: FeatureCode[]) => {
        codeQueue = unique(codeQueue.concat(codes));
    };

    useMemo(() => {
        // Features are queued up during render to gather possible feature codes from
        // children and merge them together with feature codes from parents
        enqueue(codes);
    }, codes);

    useEffect(() => {
        if (prefetch && codes.some((code) => !isValidFeature(state[code]))) {
            get(codes).catch(noop);
        }
    }, codes);

    const featuresFlags = codes.map((code): FeatureContextValue => {
        const featureStateValue = state[code]?.value;
        return {
            get: () => get([code]).then((featuresState) => featuresState[code]),
            update: (value) => put(code, value),
            feature: featureStateValue,
            loading: featureStateValue === undefined,
            code,
        };
    });

    type CodeType = (typeof codes)[number];
    const getFeature = <T extends CodeType>(code: T) => {
        const feature = featuresFlags.find((feature) => feature.code === code);
        if (!feature) {
            throw new Error('Feature not present in codes');
        }

        return feature;
    };

    return { featuresFlags, getFeature };
};

export default useFeatures;
