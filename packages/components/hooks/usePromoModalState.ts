import { useEffect, useState } from 'react';
import { getFeature, updateFeatureValue } from 'proton-shared/lib/api/features';

import useApi from './useApi';
import useLoading from './useLoading';

const usePromoModalState = (featureID: string, fallbackValue = true) => {
    const [loading, withLoading] = useLoading(true);
    const [state, setState] = useState(false);
    const api = useApi();
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });

    const fetchFeature = async () => {
        try {
            const { Feature } = await silentApi(getFeature(featureID));
            const { Value, DefaultValue } = Feature;
            setState(typeof Value === 'undefined' ? DefaultValue : Value);
        } catch {
            // If it fails, we define promo state as already seen
            setState(fallbackValue);
        }
    };

    useEffect(() => {
        withLoading(fetchFeature());
    }, []);

    const onChange = async (Value: boolean) => {
        await api(updateFeatureValue(featureID, Value));
        setState(Value);
    };

    return [state, loading, onChange] as const;
};

export default usePromoModalState;
