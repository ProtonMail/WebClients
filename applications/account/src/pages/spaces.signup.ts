import { SPACES_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';
import { getSignupDescription, getSignupTitle } from './interface';

const data = (): Parameters => ({
    title: getSignupTitle(SPACES_APP_NAME),
    description: getSignupDescription(SPACES_APP_NAME),
});

export default data;
