import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { KtState } from '@proton/account/kt';
import type { MemberState } from '@proton/account/member';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MspSubsidiariesState } from './index';

// Custom dispatch because msp isn't in shared reducers. One day it might be though.
type MspDispatch = ReturnType<
    typeof baseUseDispatch<
        ThunkDispatch<OrganizationKeyState & MemberState & KtState & MspSubsidiariesState, ProtonThunkArguments, Action>
    >
>;
export const useMspDispatch: () => MspDispatch = baseUseDispatch;
