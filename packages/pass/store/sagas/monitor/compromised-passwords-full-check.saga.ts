import { call, cancel, cancelled, delay, fork, put, select } from 'redux-saga/effects';

import { api } from '../../../lib/api/api';
import { getItemKey, intoSelectedItem } from '../../../lib/items/item.utils';
import { checkPasswordCompromised, getLastChangeTimestamp } from '../../../lib/monitor/compromised-password.request';
import type { CompromisedPasswordEntry } from '../../../lib/monitor/types';
import { isOnline } from '../../../lib/network/connectivity.utils';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import type { ItemRevision, UniqueItem } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { pool } from '../../../utils/fp/promises';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import type { CompromisedPasswordsCheckDTO } from '../../actions/creators/monitor';
import {
    checkCompromisedPasswords,
    compromisedPasswordsBatchUpdate,
    compromisedPasswordsProgress,
    compromisedPasswordsSync,
} from '../../actions/creators/monitor';
import { createRequestSaga } from '../../request/sagas';
import {
    selectCompromisedPasswordsCache,
    selectFeatureFlag,
    selectLastSyncedChange,
    selectMonitoredLogins,
    selectPassPlan,
} from '../../selectors';

const COMPROMISED_PASSWORD_CHECK_CONCURRENCY = 4;
const COMPROMISED_PASSWORD_PERSIST_THROTTLE_MS = 1_000;

function* checkCompromisedPasswordsWorker(payload: CompromisedPasswordsCheckDTO): Generator<any, UniqueItem[], any> {
    const ctrl = new AbortController();

    try {
        if (!isOnline(api.getState())) return [];
        if (!(yield select(selectFeatureFlag(PassFeature.PassCompromisedPasswords)))) return [];
        if (!isPaidPlan(yield select(selectPassPlan))) return [];

        const logins: ReturnType<ReturnType<typeof selectMonitoredLogins>> = yield select(selectMonitoredLogins(payload.shareIds));
        const candidates = logins.filter((item) => item.data.content.password.v.length);

        const cache: ReturnType<typeof selectCompromisedPasswordsCache> = yield select(selectCompromisedPasswordsCache);
        const lastSyncedChange: ReturnType<typeof selectLastSyncedChange> = yield select(selectLastSyncedChange);
        const currentChange: number | undefined = yield call(() => getLastChangeTimestamp(ctrl.signal).catch(() => undefined));

        const isFresh = (item: ItemRevision) => cache[getItemKey(item)]?.revision === item.revision;

        if (currentChange !== undefined && currentChange === lastSyncedChange && candidates.every(isFresh)) {
            return candidates.filter((item) => cache[getItemKey(item)]?.compromised).map(intoSelectedItem);
        }

        const groups = new Map<string, ItemRevision[]>();
        for (const item of candidates) {
            const password = deobfuscate(item.data.content.password);
            const group = groups.get(password) ?? [];
            group.push(item);
            groups.set(password, group);
        }

        const entries = Array.from(groups.entries());
        let hadFailure = false;
        let completedCount = 0;

        yield put(compromisedPasswordsProgress({ completed: 0, total: entries.length }));

        const buffer = new Map<string, { item: UniqueItem; entry: CompromisedPasswordEntry }>();

        function* flushOnce() {
            yield put(compromisedPasswordsProgress({ completed: completedCount, total: entries.length }));
            if (buffer.size === 0) return;
            yield put(compromisedPasswordsBatchUpdate(Array.from(buffer.values())));
            buffer.clear();
        }

        function* flushLoop() {
            while (true) {
                yield delay(COMPROMISED_PASSWORD_PERSIST_THROTTLE_MS);
                yield call(flushOnce);
            }
        }

        let groupResults: (Omit<CompromisedPasswordEntry, 'revision'> | null)[];
        const flushTask = yield fork(flushLoop);

        try {
            groupResults = yield call(() =>
                pool(
                    entries,
                    COMPROMISED_PASSWORD_CHECK_CONCURRENCY,
                    async ([password, items]): Promise<Omit<CompromisedPasswordEntry, 'revision'> | null> => {
                        const primary = items[0];
                        const prior = isFresh(primary) ? cache[getItemKey(primary)] : undefined;

                        if (prior && (prior.compromised || (currentChange !== undefined && prior.lastChangeAtCheck === currentChange))) {
                            return prior;
                        }

                        const persist = (entry: Omit<CompromisedPasswordEntry, 'revision'>) => {
                            items.forEach((item) =>
                                buffer.set(getItemKey(item), {
                                    item: intoSelectedItem(item),
                                    entry: { ...entry, revision: item.revision },
                                })
                            );
                            return entry;
                        };

                        try {
                            const check = await checkPasswordCompromised(password, prior?.etag, ctrl.signal);
                            if (check.status === 'not-modified' && prior) {
                                return persist({ ...prior, lastChangeAtCheck: currentChange });
                            }
                            return persist({
                                compromised: check.status === 'checked' ? check.compromised : false,
                                etag: check.status === 'checked' ? check.etag : '',
                                lastChangeAtCheck: currentChange,
                            } satisfies Omit<CompromisedPasswordEntry, 'revision'>);
                        } catch (error) {
                            if (ctrl.signal.aborted) throw error;
                            /* one password's request failing shouldn't discard every
                             * other password already checked this run */
                            hadFailure = true;
                            return prior ?? null;
                        }
                    },
                    (completed: number) => {
                        completedCount = completed;
                    }
                )
            );
        } finally {
            yield cancel(flushTask);
            yield call(flushOnce);
        }

        const results = entries.flatMap(([, items], idx) => {
            const entry = groupResults[idx];
            return entry ? items.map((item) => ({ item, entry: { ...entry, revision: item.revision } })) : [];
        });

        if (!hadFailure) {
            yield put(compromisedPasswordsSync({ lastSyncedChange: currentChange ?? lastSyncedChange, results }));
        }

        return results.filter(({ entry }) => entry.compromised).map(({ item }) => intoSelectedItem(item));
    } finally {
        if (yield cancelled()) ctrl.abort();
        yield put(compromisedPasswordsProgress({ completed: 0, total: 0 }));
    }
}

export default createRequestSaga({ actions: checkCompromisedPasswords, call: checkCompromisedPasswordsWorker });
