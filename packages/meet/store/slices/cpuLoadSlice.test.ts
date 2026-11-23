import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import {
    CPU_LOAD_DROPS_IN_APPLY_ORDER,
    cpuLoadReducer,
    resetCpuLoad,
    selectCpuLoadDropCount,
    selectIsCpuLoadDropActive,
    setCpuLoadDropCount,
} from './cpuLoadSlice';

const createStore = () => {
    const store = configureStore({ reducer: { ...cpuLoadReducer } });
    const getState = () => store.getState() as MeetState;

    return {
        dispatch: store.dispatch,
        getDropCount: () => selectCpuLoadDropCount(getState()),
        getActiveDrops: () =>
            CPU_LOAD_DROPS_IN_APPLY_ORDER.filter((drop) => selectIsCpuLoadDropActive(getState(), drop)),
    };
};

describe('cpuLoadSlice', () => {
    it('should start with no drop active', () => {
        const { getDropCount, getActiveDrops } = createStore();

        expect(getDropCount()).toBe(0);
        expect(getActiveDrops()).toEqual([]);
    });

    it('should activate the drops in order', () => {
        const { dispatch, getActiveDrops } = createStore();

        dispatch(setCpuLoadDropCount(1));
        expect(getActiveDrops()).toEqual(['incomingVideoQuality']);

        dispatch(setCpuLoadDropCount(2));
        expect(getActiveDrops()).toEqual(['incomingVideoQuality', 'backgroundModel']);

        dispatch(setCpuLoadDropCount(3));
        expect(getActiveDrops()).toEqual(['incomingVideoQuality', 'backgroundModel', 'publishedHighLayer']);
    });

    it('should clamp the count to the number of drops', () => {
        const { dispatch, getDropCount } = createStore();

        dispatch(setCpuLoadDropCount(10));
        expect(getDropCount()).toBe(CPU_LOAD_DROPS_IN_APPLY_ORDER.length);

        dispatch(setCpuLoadDropCount(-1));
        expect(getDropCount()).toBe(0);
    });

    it('should clear every drop on reset', () => {
        const { dispatch, getDropCount } = createStore();

        dispatch(setCpuLoadDropCount(2));
        dispatch(resetCpuLoad());

        expect(getDropCount()).toBe(0);
    });
});
