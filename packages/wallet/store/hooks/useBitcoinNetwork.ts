import { createHooks } from '@proton/redux-utilities';

import { bitcoinNetworkThunk, selectBitcoinNetwork } from '../slices';

const hooks = createHooks(bitcoinNetworkThunk, selectBitcoinNetwork);

export const useBitcoinNetwork = hooks.useValue;
export const useGetBitcoinNetwork = hooks.useGet;
