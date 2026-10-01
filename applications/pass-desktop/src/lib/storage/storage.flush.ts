import type { Session } from 'electron';
import debounce from 'lodash/debounce';

import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

/** Chromium commits DOMStorage and cookies to disk lazily, so an abrupt
 * termination (process kill, OS reboot) drops the latest writes. Both hold
 * the session: the persisted session blob lives in `localStorage` and the
 * refresh token in a cookie rotated on every refresh. Losing either breaks
 * the next session resume. */
export const flushStorageData = (session: MaybeNull<Session>) => session?.flushStorageData();

const flushCookies = (session: MaybeNull<Session>) => session?.cookies.flushStore().catch(noop);

export const flushAll = async (session: MaybeNull<Session>) => {
    flushStorageData(session);
    await flushCookies(session);
};

export const installCookieFlush = (session: Session) =>
    session.cookies.on(
        'changed',
        debounce(() => flushCookies(session), 250)
    );
