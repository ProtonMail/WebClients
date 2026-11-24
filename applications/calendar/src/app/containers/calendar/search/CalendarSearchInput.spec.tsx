import type { ComponentProps } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import SpotlightProvider from '@proton/components/components/spotlight/Provider';
import { mockUseSpotlightOnFeature } from '@proton/components/testing/mockUseSpotlightOnFeature';

import CalendarSearchInput from './CalendarSearchInput';

vi.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: vi.fn().mockReturnValue({
        APP_NAME: 'proton-calendar',
    }),
}));

const baseProps: ComponentProps<typeof CalendarSearchInput> = {
    value: '',
    setValue: vi.fn(),
    loading: false,
    onBack: vi.fn(),
    onSearch: vi.fn(),
    isSearchActive: true,
};

const renderComponent = (props: ComponentProps<typeof CalendarSearchInput>) => {
    render(
        <SpotlightProvider>
            <CalendarSearchInput {...props} />
        </SpotlightProvider>
    );
};

describe('CalendarSearchInput', () => {
    describe('when input is focused', () => {
        const onSpotlightClose = vi.fn();

        beforeEach(() => {
            mockUseSpotlightOnFeature({ show: true, onClose: onSpotlightClose });
        });

        afterEach(() => {
            onSpotlightClose.mockClear();
        });

        it('should be focused on click', async () => {
            renderComponent({ ...baseProps });
            const input = screen.getByRole('textbox');
            await userEvent.click(input);

            await waitFor(() => {
                expect(input).toHaveFocus();
            });
        });
    });

    describe('when Search button is hit', () => {
        it('should open', async () => {
            const onSearch = vi.fn();

            renderComponent({ ...baseProps, value: 'test', onSearch });

            const button = screen.getByRole('button', { name: 'Search' });
            await userEvent.click(button);

            await waitFor(() => {
                expect(onSearch).toHaveBeenCalledTimes(1);
            });

            expect(onSearch).toHaveBeenCalledWith();
        });
    });

    describe('when clear button is hit', () => {
        it('act clear search and open', async () => {
            const testValue = 'test value here';
            renderComponent({ ...baseProps, value: testValue });

            expect(screen.getByDisplayValue(testValue));

            const button = screen.getByText('Clear');
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.queryByText(testValue)).not.toBeInTheDocument();
            });
        });
    });
});
