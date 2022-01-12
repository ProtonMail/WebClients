import { useMemo, useContext, useEffect } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';

import { FeatureCode, FeatureContextValue, FeaturesContext } from '../containers/features';

const useFeatures = (codes: FeatureCode[], prefetch = true) => {
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

    return codes.map((code): FeatureContextValue => {
        return {
            get: () => get([code]).then(([result]) => result),
            update: (value) => put(code, value),
            feature: features[code],
            loading: loading[code] === undefined || !!loading[code],
        };
    });
};

export default useFeatures;
