import { createHooks } from '@proton/redux-utilities';

import { incomingAddressForwardingsThunk, selectIncomingForwarding } from './incoming';
import { outgoingAddressForwardingsThunk, selectOutgoingForwarding } from './outgoing';

const incomingHooks = createHooks(incomingAddressForwardingsThunk, selectIncomingForwarding);
const outgoingHooks = createHooks(outgoingAddressForwardingsThunk, selectOutgoingForwarding);

export const useIncomingAddressForwardings = incomingHooks.useValue;
export const useGetIncomingAddressForwardings = incomingHooks.useGet;
export const useOutgoingAddressForwardings = outgoingHooks.useValue;
export const useGetOutgoingAddressForwardings = outgoingHooks.useGet;
