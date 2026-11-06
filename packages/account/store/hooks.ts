import type { Store } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonDispatch } from '@proton/redux-shared-store-types/interface';

export const useStore: () => Store = baseUseStore;
export const useDispatch: () => ProtonDispatch<any> = baseUseDispatch;
export const useSelector = baseUseSelector;
