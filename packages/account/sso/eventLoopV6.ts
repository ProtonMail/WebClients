import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { authDevicesEventLoopV6Thunk, selectAuthDevices } from './authDevices';
import { memberAuthDevicesEventLoopV6Thunk, selectMemberAuthDevices } from './memberAuthDevices';

export const authDevicesLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
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
