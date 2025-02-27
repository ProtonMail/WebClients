import { createSelector } from '@reduxjs/toolkit';

import type { INCOMING_DEFAULTS_LOCATION } from '@proton/shared/lib/constants';

import type { MailState } from '../store';

const incomingDefaults = (state: MailState) => state.incomingDefaults;
const incomingDefaultLocation = (_: MailState, location: INCOMING_DEFAULTS_LOCATION) => location;

export const getIncomingDefaultsList = createSelector([incomingDefaults], (incomingDefaults) => incomingDefaults.list);

export const getIncomingDefaultsAddresses = createSelector([getIncomingDefaultsList], (incomingDefaultsList) =>
    incomingDefaultsList.filter((item) => !!item.Email)
);

export const getIncomingDefaultStatus = createSelector(
    [incomingDefaults],
    (incomingDefaults) => incomingDefaults.status
);

export const getIncomingDefaultsByLocation = createSelector(
    [incomingDefaults, incomingDefaultLocation],
    (incomingDefaults, location) => incomingDefaults.list.filter((item) => item.Location === location)
);
