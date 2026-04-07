import React, { act } from 'react';
import ReactDOM from 'react-dom/client';

import * as storage from '@proton/shared/lib/helpers/storage';

import { useDeclarativeLocalState } from './useDeclarativeLocalState';

jest.mock('@proton/shared/lib/helpers/storage');

describe('useDeclarativeLocalState', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    function renderHook() {
        let state: string | undefined;
        let setValue: (value: string) => void;
        let hasStoredValue: boolean;

        const TestComponent = () => {
            [state, setValue, hasStoredValue] = useDeclarativeLocalState<string>('key');
            return null;
        };

        act(() => {
            ReactDOM.createRoot(container).render(<TestComponent />);
        });

        return {
            get state() {
                return state;
            },
            get setValue() {
                return setValue;
            },
            get hasStoredValue() {
                return hasStoredValue;
            },
        };
    }

    it.each`
        stored                     | expected
        ${JSON.stringify('hello')} | ${'hello'}
        ${JSON.stringify(false)}   | ${false}
        ${JSON.stringify(true)}    | ${true}
        ${JSON.stringify(0)}       | ${0}
        ${JSON.stringify('')}      | ${''}
        ${JSON.stringify(null)}    | ${null}
    `('handles stored value: $stored', ({ stored, expected }) => {
        (storage.getItem as jest.Mock).mockReturnValue(stored);

        const hook = renderHook();

        expect(hook.state).toBe(expected);
        expect(hook.hasStoredValue).toBe(true);
    });

    it('handles invalid JSON but still marks as stored', () => {
        (storage.getItem as jest.Mock).mockReturnValue('bad-json');

        const hook = renderHook();

        expect(hook.state).toBeUndefined();
        expect(hook.hasStoredValue).toBe(true);
    });

    it('returns undefined when nothing stored', () => {
        (storage.getItem as jest.Mock).mockReturnValue(null);

        const hook = renderHook();

        expect(hook.state).toBeUndefined();
        expect(hook.hasStoredValue).toBe(false);
    });

    it('updates state and persists value', () => {
        (storage.getItem as jest.Mock).mockReturnValue(null);

        const hook = renderHook();

        act(() => {
            hook.setValue('new-value');
        });

        expect(hook.state).toBe('new-value');
        expect(storage.setItem).toHaveBeenCalledWith('key', JSON.stringify('new-value'));
    });

    it('does not write on initial render', () => {
        renderHook();

        expect(storage.setItem).not.toHaveBeenCalled();
    });
});
