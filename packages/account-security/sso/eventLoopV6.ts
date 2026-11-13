import type { CoreEventLoopV6Callback } from '@proton/account/coreEventLoop/interface';

import { type AuthDevicesState, authDevicesEventLoopV6Thunk, selectAuthDevices } from './authDevices';
import {
    type MemberAuthDevicesState,
    memberAuthDevicesEventLoopV6Thunk,
    selectMemberAuthDevices,
} from './memberAuthDevices';

export type AuthDevicesLoopState = AuthDevicesState & MemberAuthDevicesState;

export const authDevicesLoop: CoreEventLoopV6Callback<AuthDevicesLoopState> = ({ event, state, dispatch, api }) => {
    const promises = [];
    if (event.AuthDevices?.length && selectAuthDevices(state)?.value) {
        promises.push(dispatch(authDevicesEventLoopV6Thunk({ event, api })));
    }
    if (event.MemberAuthDevices?.length && selectMemberAuthDevices(state)?.value) {
        promises.push(dispatch(memberAuthDevicesEventLoopV6Thunk({ event, api })));
    }
    if (promises.length) {
        return Promise.all(promises);
    }
};
