import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';
import { getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(PASS_APP_NAME),
    description: getLoginDescription(PASS_APP_NAME),
});

export default data;
