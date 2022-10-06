import { Suspense, lazy } from 'react';

import Loader from '../../loader/Loader';
import { Props as PhoneInputProps } from './PhoneInput';

const PhoneInput = lazy(() => import(/* webpackChunkName: "PhoneInput", webpackPreload: true */ './PhoneInput'));

const LazyPhoneInput = (props: PhoneInputProps) => {
    return (
        <Suspense fallback={<Loader />}>
            <PhoneInput {...props} />
        </Suspense>
    );
};

export default LazyPhoneInput;
