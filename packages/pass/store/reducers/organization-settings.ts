import type { Reducer } from 'redux';

import {
    getOrganizationSettingsSuccess,
    organizationSettingsEditSuccess,
} from '@proton/pass/store/actions/creators/organizationSettings';
import { type Maybe } from '@proton/pass/types';
import { type OrganizationSettings, SettingMode } from '@proton/pass/types/data/organization';

const initialState: OrganizationSettings = {
    shareMode: SettingMode.UNLIMITED,
    exportMode: SettingMode.UNLIMITED,
};

const reducer: Reducer<Maybe<OrganizationSettings>> = (state = initialState, action) => {
    if (getOrganizationSettingsSuccess.match(action)) {
        return action.payload;
    }

    if (organizationSettingsEditSuccess.match(action)) {
        return action.payload;
    }

    return state;
};

export default reducer;
