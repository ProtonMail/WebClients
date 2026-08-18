import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { KtState } from '../kt';
import type { MemberState } from '../member';
import type { OrganizationKeyState } from '../organizationKey';
import type { MspSubsidiariesState } from './index';

// Custom dispatch because msp isn't in shared reducers. One day it might be though.
type MspDispatch = ReturnType<
    typeof baseUseDispatch<
        ThunkDispatch<OrganizationKeyState & MemberState & KtState & MspSubsidiariesState, ProtonThunkArguments, Action>
    >
>;
export const useMspDispatch: () => MspDispatch = baseUseDispatch;
