import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Thank you for installing ${PASS_APP_NAME}`,
    description: c('Metadata description').t`Setup ${PASS_APP_NAME} browser extension.`,
});

export default data;
