import { createAction } from '@reduxjs/toolkit';

import type { SelectedItem } from '@proton/pass/types';

export const autofillIntent = createAction('autofill::intent', (payload: SelectedItem) => ({ payload }));
