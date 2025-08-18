import { selectPersistModel } from '@proton/redux-utilities';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DelegatedAccessState } from './index';

export const selectDelegatedAccessPersist = (state: DelegatedAccessState['delegatedAccess']) => {
    if (selectPersistModel(state.incomingDelegatedAccess) || selectPersistModel(state.outgoingDelegatedAccess)) {
        return {
            incomingDelegatedAccess: omit(state.incomingDelegatedAccess, ['ephemeral']),
            outgoingDelegatedAccess: state.outgoingDelegatedAccess,
        };
    }
};
