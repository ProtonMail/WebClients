import { Fragment } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import { getLocaleTermsURL } from '../content/helper';

export const getTerms = (app: APP_NAMES) => {
    const terms = (
        <Fragment key="terms">
            <br />
            <Href href={getLocaleTermsURL(app)}>{
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }</Href>
        </Fragment>
    );

    // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
    return c('new_plans: signup').jt`By creating a ${BRAND_NAME} account, you agree to our ${terms}`;
};
