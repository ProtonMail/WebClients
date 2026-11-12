import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { allSubscriptionsThunk, selectAllSubscriptions } from '@proton/account/allSubscriptions';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import { mailContext } from '../telemetry/context';
import type { AppStartListening } from './store';
import { startTrackerContextListener } from './trackerContextListener';

jest.mock('@proton/account/allSubscriptions', () => ({
    allSubscriptionsThunk: jest.fn(() => () => Promise.resolve()),
    selectAllSubscriptions: jest.fn((state: { value?: Subscription[] }) => ({
        value: state.value,
    })),
}));

const subscription = (name: string) => ({ Plans: [{ Name: name, Type: 1 }] }) as unknown as Subscription;

const setup = (preloaded?: { value?: Subscription[] }) => {
    const listener = createListenerMiddleware();
    const store = configureStore({
        reducer: (
            state: { value?: Subscription[] } = preloaded ?? {},
            action: { type: string; value?: Subscription[] }
        ) => (action.type === 'load' ? { value: action.value } : state),
        middleware: (getDefault) => getDefault().prepend(listener.middleware),
    });
    startTrackerContextListener(listener.startListening as unknown as AppStartListening);
    return store;
};

describe('trackerContextListener', () => {
    afterEach(() => {
        mailContext.reset();
        jest.mocked(selectAllSubscriptions).mockClear();
    });

    it('keeps the plan unknown until the subscriptions load', () => {
        const store = setup();
        store.dispatch({ type: 'other' });
        expect(mailContext.get('plan')).toBe('unknown');
    });

    it('reads subscriptions restored from the persisted state, even if they never change', () => {
        const store = setup({ value: [subscription('mail2022')] });
        store.dispatch({ type: 'other' });
        expect(mailContext.get('plan')).toBe('mail2022');
    });

    it('fetches the subscriptions once, on the first action', () => {
        const store = setup();
        jest.mocked(allSubscriptionsThunk).mockClear();
        store.dispatch({ type: 'other' });
        store.dispatch({ type: 'other' });
        expect(allSubscriptionsThunk).toHaveBeenCalledTimes(1);
    });

    it('follows the subscriptions', () => {
        const store = setup();
        store.dispatch({ type: 'load', value: [] });
        expect(mailContext.get('plan')).toBe('free');
        store.dispatch({ type: 'load', value: [subscription('mail2022')] });
        expect(mailContext.get('plan')).toBe('mail2022');
    });
});
