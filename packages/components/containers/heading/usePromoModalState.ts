import { useRef, useEffect, useState } from 'react';
import { getFeature, updateFeatureValue } from 'proton-shared/lib/api/features';
import { getSHA256String } from 'proton-shared/lib/helpers/hash';
import { BLACK_FRIDAY } from 'proton-shared/lib/constants';
import { getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';
import { getSecondLevelDomain } from 'proton-shared/lib/helpers/url';

import { useApi, useUser, useLoading } from '../../hooks';

const FEATURE_ID = 'BlackFridayPromoShown';

const cookieExpirationDate = BLACK_FRIDAY.END.toUTCString();
const cookiePath = '/';
const cookieDomain = `.${getSecondLevelDomain()}`;

const setModalCookie = (key: string, value: string) => {
    setCookie({
        cookieName: key,
        cookieValue: value,
        expirationDate: cookieExpirationDate,
        path: cookiePath,
        cookieDomain,
    });
};

const usePromoModalState = () => {
    const [loading, withLoading] = useLoading(true);
    const [state, setState] = useState(false);
    const api = useApi();
    const [user] = useUser();
    const keys = useRef<{ blackFridayStateKey?: string; productPayerStateKey?: string }>({});

    const fetchFeature = async () => {
        // Search cookie state first
        const [newBlackFridayStateKey, newProductPayerStateKey] = await Promise.all([
            getSHA256String(`${user.ID}${BLACK_FRIDAY.COUPON_CODE}-black-friday-modal`),
            getSHA256String(`${user.ID}-product-payer-modal`),
        ]);

        keys.current.blackFridayStateKey = newBlackFridayStateKey.slice(0, 8);
        keys.current.productPayerStateKey = newProductPayerStateKey.slice(0, 8);

        if (getCookie(keys.current.blackFridayStateKey) || getCookie(keys.current.productPayerStateKey)) {
            setState(true);
            return;
        }

        // Otherwise check API state
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

        if (keys.current.blackFridayStateKey) {
            setModalCookie(keys.current.blackFridayStateKey, '1');
        }
    };

    return [state, loading, onChange] as const;
};

export default usePromoModalState;
