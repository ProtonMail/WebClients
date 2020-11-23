import { useEffect, useState } from 'react';
import { getFeature, updateFeatureValue } from 'proton-shared/lib/api/features';

import { useApi, useLoading } from '../../hooks';

const FEATURE_ID = 'BlackFridayPromoShown';

const usePromoModalState = () => {
    const [loading, withLoading] = useLoading(true);
    const [state, setState] = useState(false);
    const api = useApi();

    const fetchFeature = async () => {
        const { Feature } = await api(getFeature(FEATURE_ID));
        const { Value, DefaultValue } = Feature;
        setState(typeof Value === 'undefined' ? DefaultValue : Value);
    };

    useEffect(() => {
        withLoading(fetchFeature());
    }, []);

    const onChange = async (Value: boolean) => {
        await api(updateFeatureValue(FEATURE_ID, Value));
        setState(Value);
    };

    return [state, loading, onChange] as const;
};

export default usePromoModalState;
