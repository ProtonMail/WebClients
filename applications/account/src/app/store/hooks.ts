import { baseUseDispatch } from '@proton/react-redux-store';

import type { AccountDispatch } from './store';

export const useAccountDispatch: () => AccountDispatch = baseUseDispatch;
