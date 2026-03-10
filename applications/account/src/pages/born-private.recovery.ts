import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Recover your child's ${BRAND_NAME} account | ${BRAND_NAME}`,
    description: c('Metadata title')
        .t`Recover access to the private ${BRAND_NAME} email address reserved for your child.`,
});

export default data;
