import { useContext, useEffect, useMemo } from 'react';

import noop from '@proton/utils/noop';

import { FeatureCode, FeatureContextValue, FeaturesContext } from '../containers/features';

const useFeatures = <Flags extends FeatureCode>(codes: Flags[], prefetch = true) => {
    const { features, loading, get, put, enqueue } = useContext(FeaturesContext);

    useMemo(() => {
        // Features are queued up during render to gather possible feature codes from
        // children and merge them together with feature codes from parents
        enqueue(codes);
    }, codes);

    useEffect(() => {
        if (prefetch) {
            get(codes).catch(noop);
        }
    }, codes);

    const featuresFlags = codes.map((code): FeatureContextValue => {
        return {
            get: () => get([code]).then(([result]) => result),
            update: (value) => put(code, value),
            feature: features[code],
            loading: loading[code] === undefined || !!loading[code],
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
