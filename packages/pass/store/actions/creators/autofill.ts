import { createAction } from '@reduxjs/toolkit';

import type { SelectedItem } from '@proton/pass/types';

import withCacheBlock from '../with-cache-block';

export const itemAutofillIntent = createAction('item autofill intent', (payload: SelectedItem) =>
    withCacheBlock({ payload })
);
