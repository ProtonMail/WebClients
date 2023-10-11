import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { SelectedItem } from '@proton/pass/types';

export const itemAutofillIntent = createAction('item autofill intent', (payload: SelectedItem) =>
    withCacheBlock({ payload })
);
