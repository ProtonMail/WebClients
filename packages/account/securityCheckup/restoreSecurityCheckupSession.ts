import type { ProtonDispatch } from '@proton/redux-shared-store-types';

import { getSecurityCheckupSessionItem } from './helpers/securityCheckupSessionStorage';
import { securityCheckupSlice } from './slice';

const restoreSecurityCheckupSession = ({ dispatch, userId }: { dispatch: ProtonDispatch<any>; userId: string }) => {
    const persistedSecurityCheckupSession = getSecurityCheckupSessionItem(userId);

    dispatch(securityCheckupSlice.actions.setSession({ session: persistedSecurityCheckupSession }));
};

export default restoreSecurityCheckupSession;
