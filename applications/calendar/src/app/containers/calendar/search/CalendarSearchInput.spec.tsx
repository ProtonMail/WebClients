import type { ComponentProps } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SpotlightProvider } from '@proton/components';
import { mockUseSpotlightOnFeature } from '@proton/testing';

import CalendarSearchInput from './CalendarSearchInput';

const baseProps: ComponentProps<typeof CalendarSearchInput> = {
    value: '',
    setValue: jest.fn(),
    loading: false,
    onBack: jest.fn(),
    onSearch: jest.fn(),
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
        const onSpotlightClose = jest.fn();

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
            const onSearch = jest.fn();

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
