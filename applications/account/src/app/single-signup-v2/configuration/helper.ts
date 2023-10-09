import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export const getBenefits = (appName: string) => {
    return c('pass_signup_2023: Info').t`${appName} benefits`;
};
export const getJoinString = () => {
    return c('pass_signup_2023: Info')
        .t`Join over 100 million people who have chosen ${BRAND_NAME} to stay safe online`;
};
