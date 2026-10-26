import { configureStore } from '@reduxjs/toolkit';

import { createTestSchedule } from '../../tests/fixtures/schedules';
import { SpaceType } from '../../types';
import { rootReducer } from '../rootReducer';
import { selectSchedules } from '../selectors';
import { addSpace } from './core/spaces';
import { saveSchedule } from './schedules';

const makeStore = () =>
    configureStore({ reducer: rootReducer, middleware: (getDefault) => getDefault({ serializableCheck: false }) });

describe('schedule spaces', () => {
    it('preserves identity and encryption key when editing schedule settings', () => {
        const store = makeStore();
        const id = 'schedule-1';
        const details = createTestSchedule();
        store.dispatch(saveSchedule(id, details));
        const before = store.getState().spaces[id];
        const updated = createTestSchedule({ name: 'Edited task', autoApprove: true, notifyOnComplete: false });
        store.dispatch(saveSchedule(id, updated, 'edit'));
        expect(selectSchedules(store.getState())).toEqual({ [id]: updated });
        expect(store.getState().spaces[id]).toMatchObject({
            createdAt: before.createdAt,
            spaceKey: before.spaceKey,
            spaceType: SpaceType.Schedule,
        });
    });

    it('does not overwrite other space types or recreate a removed schedule on edit', () => {
        const store = makeStore();
        const id = 'schedule-1';
        const details = createTestSchedule();
        expect(() => store.dispatch(saveSchedule(id, details, 'edit'))).toThrow();
        store.dispatch(
            addSpace({
                id: id,
                spaceType: SpaceType.Default,
                createdAt: 'created',
                updatedAt: 'updated',
                spaceKey: 'key',
            })
        );
        expect(() => store.dispatch(saveSchedule(id, details))).toThrow();
        expect(() => store.dispatch(saveSchedule(id, details, 'edit'))).toThrow();
        expect(selectSchedules(store.getState())).toEqual({});
    });
});
