import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import PhoneInput from './PhoneInput';
import { getCountryFromNumber, getCursorPosition, getSpecificCountry } from './helper';

const Test = ({ initialValue, defaultCountry }: { initialValue: string; defaultCountry?: string }) => {
    const [value, setValue] = useState(initialValue);
    return <PhoneInput defaultCountry={defaultCountry} data-testid="input" value={value} onChange={setValue} />;
};

const getCountry = (el: HTMLElement) => {
    return el.getAttribute('aria-label');
};

jest.mock('./flagSvgs', () => {
    return {
        getFlagSvg: () => true,
    };
});
jest.mock('react-virtualized', () => {
    const ReactVirtualized = jest.requireActual('react-virtualized');
    return {
        ...ReactVirtualized,
        // @ts-ignore
        AutoSizer: ({ children }) => children({ height: 1000, width: 1000 }),
    };
});

interface TestCommands {
    input?: string;
    select?: string;
    expectation: { value: string; country: string | null };
}

const runTest = (testCommands: TestCommands[]) => {
    const { getByTestId, getByRole, getByPlaceholderText, getByTitle } = render(
        <Test initialValue="" defaultCountry="US" />
    );

    const inputEl = getByTestId('input') as HTMLInputElement;
    const buttonEl = getByRole('button') as HTMLButtonElement;

    testCommands.forEach(({ input, select, expectation: { value, country } }) => {
        if (select !== undefined) {
            fireEvent.click(buttonEl);
            const searchEl = getByPlaceholderText('Country');
            fireEvent.change(searchEl, { target: { value: select } });
            const rowEl = getByTitle(select);
            fireEvent.click(rowEl);
        }
        if (input !== undefined) {
            fireEvent.change(inputEl, { target: { value: input } });
        }
        expect(inputEl.value).toBe(value);
        expect(getCountry(buttonEl)).toBe(country);
    });
};

describe('PhoneInput', () => {
    it('should format input', () => {
        const spy = jest.fn();
        const { getByTestId, getByRole, rerender } = render(
            <PhoneInput value="+41781234567" data-testid="input" onChange={spy} />
        );
        const input = getByTestId('input') as HTMLInputElement;
        const button = getByRole('button') as HTMLButtonElement;
        expect(input.value).toBe('78 123 45 67');
        expect(getCountry(button)).toBe('Switzerland');
        rerender(<PhoneInput data-testid="input" value="+410782354666" onChange={spy} />);
        expect(input.value).toBe('78 235 46 66');
        expect(getCountry(button)).toBe('Switzerland');
        rerender(<PhoneInput data-testid="input" value="+1613123" onChange={spy} />);
        expect(input.value).toBe('613 123');
        expect(getCountry(button)).toBe('Canada');
        rerender(<PhoneInput data-testid="input" value="+1631123" onChange={spy} />);
        expect(input.value).toBe('631 123');
        expect(getCountry(button)).toBe('United States');
    });

    it('format as user enters text', () => {
        runTest([
            { input: '631', expectation: { value: '631', country: 'United States' } },
            { input: '6311', expectation: { value: '631 1', country: 'United States' } },
            { input: '631', expectation: { value: '631', country: 'United States' } },
            { input: '613', expectation: { value: '613', country: 'Canada' } },
            { input: '6131', expectation: { value: '613 1', country: 'Canada' } },
            { input: '61', expectation: { value: '61', country: 'Canada' } },
            { input: '', expectation: { value: '', country: 'Canada' } },
            { input: '6', expectation: { value: '6', country: 'Canada' } },
            { input: '63', expectation: { value: '63', country: 'Canada' } },
            { input: '631', expectation: { value: '631', country: 'United States' } },
        ]);
    });

    it('change country if entering with country calling code', () => {
        runTest([
            { input: '', expectation: { value: '', country: 'United States' } },
            { input: '+41', expectation: { value: '+41', country: 'Switzerland' } },
            { input: '+417', expectation: { value: '+41 7', country: 'Switzerland' } },
            { input: '+41781', expectation: { value: '+41 78 1', country: 'Switzerland' } },
            { input: '', expectation: { value: '', country: 'Switzerland' } },
            { input: '78', expectation: { value: '78', country: 'Switzerland' } },
            { input: '781', expectation: { value: '78 1', country: 'Switzerland' } },
        ]);
    });

    it('change country selecting from dropdown', () => {
        runTest([
            { input: '', expectation: { value: '', country: 'United States' } },
            { select: 'Canada', expectation: { value: '', country: 'Canada' } },
            { input: '6', expectation: { value: '6', country: 'Canada' } },
            { input: '61', expectation: { value: '61', country: 'Canada' } },
            { input: '613', expectation: { value: '613', country: 'Canada' } },
            { select: 'Bahamas', expectation: { value: '', country: 'Bahamas' } },
            { input: '6', expectation: { value: '6', country: 'Bahamas' } },
            { input: '61', expectation: { value: '61', country: 'Bahamas' } },
            { input: '613', expectation: { value: '613', country: 'Canada' } },
            { input: '631', expectation: { value: '631', country: 'United States' } },
            { select: 'Canada', expectation: { value: '', country: 'Canada' } },
        ]);
    });

    it('reset and remember country', () => {
        runTest([
            { input: '', expectation: { value: '', country: 'United States' } },
            { input: '+', expectation: { value: '+', country: null } },
            { input: '+4', expectation: { value: '+4', country: null } },
            { input: '+41', expectation: { value: '+41', country: 'Switzerland' } },
            { input: '', expectation: { value: '', country: 'Switzerland' } },
            { input: '+', expectation: { value: '+', country: null } },
        ]);
    });

    it('should get a country from a number', () => {
        expect(getCountryFromNumber('+')).toEqual('');
        expect(getCountryFromNumber('+1')).toEqual('US');
        expect(getCountryFromNumber('+11')).toEqual('US');
        expect(getCountryFromNumber('3')).toEqual('');
        expect(getCountryFromNumber('2')).toEqual('');
        expect(getCountryFromNumber('1')).toEqual('');
        expect(getCountryFromNumber('+41')).toEqual('CH');
        expect(getCountryFromNumber('+411')).toEqual('CH');
        expect(getCountryFromNumber('+411')).toEqual('CH');
        expect(getCountryFromNumber('+42')).toEqual('');
        expect(getCountryFromNumber('+320')).toEqual('BE');
    });

    it('should get a more specific country from a number', () => {
        expect(getSpecificCountry('', '1', 'US')).toEqual(['US', 0]);
        expect(getSpecificCountry('613', '1', 'US')).toEqual(['CA', 3]);
        expect(getSpecificCountry('631', '1', 'US')).toEqual(['US', 0]);
        expect(getSpecificCountry('787', '1', 'US')).toEqual(['PR', 3]);
        expect(getSpecificCountry('7', '7', 'RU')).toEqual(['KZ', 1]);
        expect(getSpecificCountry('', '7', 'KZ')).toEqual(['KZ', 0]);
    });

    it('should get cursor at position', () => {
        [
            { digit: 1, value: '1', expectation: 1 },
            { digit: 2, value: '1', expectation: 1 },
            { digit: 0, value: '1----2', expectation: 0 },
            { digit: 0, value: '--1--', expectation: 1 },
            { digit: 0, value: '--1', expectation: 1 },
            { digit: 0, value: '--12', expectation: 1 },
            { digit: 0, value: '--1-2-', expectation: 1 },
            { digit: 1, value: '--1-2-', expectation: 3 },
            { digit: 1, value: '--1----2', expectation: 6 },
            { digit: 0, value: '--1----2', expectation: 1 },
        ].forEach(({ digit, value, expectation }) => {
            expect(getCursorPosition(digit, value)).toEqual(expectation);
        });
    });
});
