import { requestFork } from '@proton/pass/auth';
import browser from '@proton/pass/globals/browser';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';

import { SSO_URL } from '../../app/config';

export const useNavigateToLogin = () => async (type: FORK_TYPE) => {
    const url = await requestFork(SSO_URL, type);
    await browser.tabs.create({ url });
};
