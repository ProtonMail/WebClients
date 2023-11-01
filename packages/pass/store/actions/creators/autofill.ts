import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { SelectedItem } from '@proton/pass/types';

export const autofillIntent = createAction('autofill::intent', (payload: SelectedItem) => withCacheBlock({ payload }));
