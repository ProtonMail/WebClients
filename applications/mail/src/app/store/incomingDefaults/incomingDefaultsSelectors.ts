import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';

const incomingDefaults = (state: MailState) => state.incomingDefaults;

const getIncomingDefaultsList = createSelector([incomingDefaults], (incomingDefaults) => incomingDefaults.list);

export const getIncomingDefaultsAddresses = createSelector([getIncomingDefaultsList], (incomingDefaultsList) =>
    incomingDefaultsList.filter((item) => !!item.Email)
);

export const getIncomingDefaultStatus = createSelector(
    [incomingDefaults],
    (incomingDefaults) => incomingDefaults.status
);
