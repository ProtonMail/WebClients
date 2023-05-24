import { disableBrowserProxyTrap } from '@proton/pass/globals/browser';

import { authFallback } from './auth-fallback';

disableBrowserProxyTrap();
authFallback();
