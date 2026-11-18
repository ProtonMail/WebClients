import { useState } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import SearchInput from './SearchInput';

const Controlled = () => {
    const [search, setSearch] = useState('');
    return (
        <>
            <SearchInput value={search} onChange={setSearch} delay={200} aria-label="search" />
            <button type="button" onClick={() => setSearch('')}>
                clear
            </button>
        </>
    );
};

describe('<SearchInput />', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

    it('should not drop a character typed while the debounced value is echoed back by the parent', () => {
        render(<Controlled />);
        const input = screen.getByLabelText('search') as HTMLInputElement;

        type(input, 'Wil');
        // Debounce fires: the effect emits "Wil" to the parent, which will echo it back through `value`.
        // The next character is typed in the same batch, before the echo is committed.
        act(() => {
            vi.advanceTimersByTime(200);
            type(input, 'Will');
        });
        expect(input.value).toBe('Will');

        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(input.value).toBe('Will');
    });

    it('should still apply a value changed by the parent', () => {
        render(<Controlled />);
        const input = screen.getByLabelText('search') as HTMLInputElement;

        type(input, 'William');
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(input.value).toBe('William');

        fireEvent.click(screen.getByText('clear'));
        expect(input.value).toBe('');
    });
});
