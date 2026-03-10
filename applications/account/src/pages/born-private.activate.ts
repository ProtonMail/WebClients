import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Activate your child's ${BRAND_NAME} account | ${BRAND_NAME}`,
    description: c('Metadata title')
        .t`Activate the private ${BRAND_NAME} email address reserved for your child and set up their account.`,
});

export default data;
