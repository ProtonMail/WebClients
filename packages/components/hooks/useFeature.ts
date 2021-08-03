import { useContext, useEffect } from 'react';

import { FeatureCode, FeaturesContext } from '../containers/features';

const useFeature = (code: FeatureCode, prefetch = true) => {
    const { features, loading, get, put } = useContext(FeaturesContext);

    useEffect(() => {
        if (prefetch) {
            get(code);
        }
    }, []);

    return {
        get: <V = any>() => get<V>(code),
        update: <V = any>(value: V) => put<V>(code, value),
        feature: features[code],
        loading: loading[code] === undefined || loading[code],
    };
};

export default useFeature;
