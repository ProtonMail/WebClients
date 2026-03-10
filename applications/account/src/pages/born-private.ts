import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Reserve your child's private email | ${BRAND_NAME}`,
    description: c('Metadata title')
        .t`A simple step today to ensure your child's digital safety tomorrow. Reserve a private ${BRAND_NAME} email address for your child.`,
});

export default data;
