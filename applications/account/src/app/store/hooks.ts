import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';

import type { AccountDispatch } from './store';

export const useAccountDispatch: () => AccountDispatch = baseUseDispatch;
