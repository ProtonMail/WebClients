import { lazy, Suspense } from 'react';
import Loader from '../../loader/Loader';
import { Props as PhoneInputProps } from './PhoneInput';

const PhoneInput = lazy(() => import('./PhoneInput'));

const LazyPhoneInput = (props: PhoneInputProps) => {
    return (
        <Suspense fallback={<Loader />}>
            <PhoneInput {...props} />
        </Suspense>
    );
};

export default LazyPhoneInput;
