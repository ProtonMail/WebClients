import { LUMO_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';
import { getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(LUMO_APP_NAME),
    description: getLoginDescription(LUMO_APP_NAME),
});

export default data;
