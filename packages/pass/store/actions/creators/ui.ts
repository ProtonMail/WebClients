import { createAction } from '@reduxjs/toolkit';

import { pipe } from '../../../utils/fp/pipe';
import type { UIStateNamespace, UIStateValue } from '../../reducers';
import type { CacheMeta } from '../enhancers/cache';
import { withSynchronousAction } from '../enhancers/client';
import { withMetaFactory } from '../enhancers/meta';

type UIStateTarget = { namespace: UIStateNamespace; key: string; persist: boolean };

const withUIStateMeta = (persist: boolean) => pipe(withMetaFactory<CacheMeta>({ cache: persist, throttle: true }), withSynchronousAction);

export const setUIStateValue = createAction('ui::state::set', (payload: UIStateTarget & { value: UIStateValue }) =>
    withUIStateMeta(payload.persist)({ payload })
);

export const unsetUIStateValue = createAction('ui::state::unset', (payload: UIStateTarget) =>
    withUIStateMeta(payload.persist)({ payload })
);
