import { createHooks } from '@proton/redux-utilities';

import { selectVpnServersCount, vpnServersCountThunk } from './serversCount';

const hooks = createHooks(vpnServersCountThunk, selectVpnServersCount);

export const useVPNServersCount = hooks.useValue;
