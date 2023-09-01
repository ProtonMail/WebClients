import { ComponentProps } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sub } from 'date-fns';

import SpotlightProvider from '@proton/components/components/spotlight/Provider';
import { SECOND } from '@proton/shared/lib/constants';
import {
    mockUseActiveBreakpoint,
    mockUseSpotlightOnFeature,
    mockUseUser,
    mockUseWelcomeFlags,
} from '@proton/testing/index';

import CalendarSearchInput from './CalendarSearchInput';

const baseProps: ComponentProps<typeof CalendarSearchInput> = {
    value: '',
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
    let mockedUseUser: ReturnType<typeof mockUseUser>;
    let mockedUseSpotlightOnFeature: ReturnType<typeof mockUseSpotlightOnFeature>;

    beforeEach(() => {
        mockedUseUser = mockUseUser([{ CreateTime: Math.floor(sub(new Date(), { weeks: 4 }).getTime() / SECOND) }]);
        mockedUseSpotlightOnFeature = mockUseSpotlightOnFeature({});
        mockUseActiveBreakpoint();
        mockUseWelcomeFlags();
    });

    afterEach(() => {
        mockedUseUser.mockReset();
        mockedUseSpotlightOnFeature.mockReset();
    });

    it('should display spotlight', () => {
        mockUseSpotlightOnFeature({ show: true });
        renderComponent(baseProps);

        expect(screen.getByText('Search for events'));
        expect(screen.getByText("Easily find the event you're looking for with our new search feature."));
        expect(screen.getByRole('link', { name: /Learn more/ }));
    });

    it('should not display spotlight', () => {
        mockUseSpotlightOnFeature({ show: false });
        renderComponent(baseProps);

        expect(screen.queryByText('Search for events')).not.toBeInTheDocument();
        expect(
            screen.queryByText("Easily find the event you're looking for with our new search feature.")
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument();
    });

    describe('when user has been create <1 week ago', () => {
        beforeEach(() => {
            mockUseUser([{ CreateTime: Math.floor(sub(new Date(), { days: 2 }).getTime() / SECOND) }]);
        });

        it('should set false to useSpotlightOnFeature call', () => {
            renderComponent(baseProps);

            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledTimes(1);
            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarEncryptedSearchSpotlight', false, {
                alpha: 1653480000000,
                beta: 1653480000000,
                default: 1653480000000,
            });
        });
    });

    describe('when user has been create >1 week ago', () => {
        describe('when user is on narrow device', () => {
            beforeEach(() => {
                mockUseUser([{ CreateTime: Math.floor(sub(new Date(), { days: 2 }).getTime() / SECOND) }]);
                mockUseActiveBreakpoint({ breakpoint: 'mobile', isDesktop: false, isMobile: true });
            });

            it('should set false to useSpotlightOnFeature call', () => {
                renderComponent(baseProps);

                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledTimes(1);
                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarEncryptedSearchSpotlight', false, {
                    alpha: 1653480000000,
                    beta: 1653480000000,
                    default: 1653480000000,
                });
            });
        });

        describe('when user is on wide device', () => {
            it('should set true to useSpotlightOnFeature call', () => {
                renderComponent(baseProps);

                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledTimes(1);
                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarEncryptedSearchSpotlight', true, {
                    alpha: 1653480000000,
                    beta: 1653480000000,
                    default: 1653480000000,
                });
            });
        });
    });

    describe('when user is in welcome flow', () => {
        it('should set false to useSpotlightOnFeature call', () => {
            mockUseWelcomeFlags([{ isWelcomeFlow: true }]);
            renderComponent(baseProps);

            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledTimes(1);
            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarEncryptedSearchSpotlight', false, {
                alpha: 1653480000000,
                beta: 1653480000000,
                default: 1653480000000,
            });
        });
    });

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
