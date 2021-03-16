import React, { useRef, useState } from 'react';
import { getFeature, updateFeatureValue } from 'proton-shared/lib/api/features';

import { useApi } from '../../hooks';
import FeaturesContext, { Feature, FeatureCode } from './FeaturesContext';

interface Props {
    children: React.ReactNode;
}

const FeaturesProvider = ({ children }: Props) => {
    const api = useApi();

    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });

    const [features, setFeatures] = useState<{ [key: string]: Feature }>({});

    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    const featureGetPromiseRef = useRef<{ [key: string]: Promise<Feature> }>({});

    const updateLoading = (code: FeatureCode, isLoading: boolean) => {
        setLoading((currentLoading) => ({ ...currentLoading, [code]: isLoading }));
    };

    const addFeature = (code: FeatureCode, feature: Feature) => {
        setFeatures((currentFeatures) => ({ ...currentFeatures, [code]: feature }));
    };

    const updateFeature = addFeature;

    const get = async (code: FeatureCode) => {
        if (features[code]) {
            return Promise.resolve(features[code]);
        }

        const createFeatureGetPromise = async () => {
            try {
                updateLoading(code, true);

                const { Feature } = await silentApi<{ Feature: Feature }>(getFeature(code));

                addFeature(code, Feature);
                updateLoading(code, false);

                return Feature;
            } catch (e) {
                delete featureGetPromiseRef.current[code];

                throw e;
            }
        };

        if (!(code in featureGetPromiseRef.current)) {
            featureGetPromiseRef.current[code] = createFeatureGetPromise();
        }

        return featureGetPromiseRef.current[code];
    };

    const put = async (code: FeatureCode, value: any) => {
        updateLoading(code, true);

        const { Feature } = await silentApi<{ Feature: Feature }>(updateFeatureValue(code, value));

        updateFeature(code, Feature);
        updateLoading(code, false);

        return Feature;
    };

    const context = { features, loading, get, put };

    return <FeaturesContext.Provider value={context}>{children}</FeaturesContext.Provider>;
};

export default FeaturesProvider;
