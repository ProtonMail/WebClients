import { SPACES_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';
import { getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(SPACES_APP_NAME),
    description: getLoginDescription(SPACES_APP_NAME),
});

export default data;
