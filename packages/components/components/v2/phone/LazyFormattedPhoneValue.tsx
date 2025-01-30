import { Suspense, lazy } from 'react';

import Loader from '../../loader/Loader';
import type { Props } from './FormattedPhoneValue';

const FormattedPhoneValue = lazy(() => import(/* webpackChunkName: "FormattedPhoneValue" */ './FormattedPhoneValue'));

const LazyFormattedPhoneValue = (props: Props) => {
    return (
        <Suspense fallback={<Loader />}>
            <FormattedPhoneValue {...props} />
        </Suspense>
    );
};

export default LazyFormattedPhoneValue;
