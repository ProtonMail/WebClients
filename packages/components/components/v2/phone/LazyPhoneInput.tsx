import type { Ref } from 'react';
import { Suspense, forwardRef, lazy } from 'react';

import Loader from '../../loader/Loader';
import type { Props as PhoneInputProps, Props } from './PhoneInput';

const PhoneInput = lazy(() => import(/* webpackChunkName: "PhoneInput" */ './PhoneInput'));

const LazyPhoneInputBase = (props: PhoneInputProps, ref: Ref<HTMLInputElement>) => {
    return (
        <Suspense fallback={<Loader />}>
            <PhoneInput {...props} ref={ref} />
        </Suspense>
    );
};

const LazyPhoneInput = forwardRef<HTMLInputElement, Props>(LazyPhoneInputBase);
export default LazyPhoneInput;
