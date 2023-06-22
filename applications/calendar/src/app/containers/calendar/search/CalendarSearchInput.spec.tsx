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
    onOpen: jest.fn(),
    onChange: jest.fn(),
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
        mockedUseSpotlightOnFeature = mockUseSpotlightOnFeature();
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
        expect(screen.getByText('Easily find the event you’re looking for with our new search feature.'));
        expect(screen.getByRole('link', { name: /Learn more/ }));
    });

    it('should not display spotlight', () => {
        mockUseSpotlightOnFeature({ show: false });
        renderComponent(baseProps);

        expect(screen.queryByText('Search for events')).not.toBeInTheDocument();
        expect(
            screen.queryByText('Easily find the event you’re looking for with our new search feature.')
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
            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarSearchSpotlight', false, {
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
                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarSearchSpotlight', false, {
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
                expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarSearchSpotlight', true, {
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
            expect(mockedUseSpotlightOnFeature).toHaveBeenCalledWith('CalendarSearchSpotlight', false, {
                alpha: 1653480000000,
                beta: 1653480000000,
                default: 1653480000000,
            });
        });
    });

    describe('when input is focused', () => {
        const onOpen = jest.fn();
        const onSpotlightClose = jest.fn();

        beforeEach(() => {
            mockUseSpotlightOnFeature({ show: true, onClose: onSpotlightClose });
            renderComponent({ ...baseProps, onOpen });
        });

        afterEach(() => {
            onOpen.mockClear();
            onSpotlightClose.mockClear();
        });

        it('should call onOpen', async () => {
            const input = screen.getByRole('textbox');
            await userEvent.click(input);

            await waitFor(() => {
                expect(onOpen).toHaveBeenCalledTimes(1);
            });
        });

        it('should hide spotlight', async () => {
            const input = screen.getByRole('textbox');
            await userEvent.click(input);

            await waitFor(() => {
                expect(onSpotlightClose).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('when Search button is hit', () => {
        it('should open', async () => {
            const onOpen = jest.fn();
            const onChange = jest.fn();
            renderComponent({ ...baseProps, value: 'test', onOpen, onChange });

            const button = screen.getByText('Search');
            await userEvent.click(button);

            await waitFor(() => {
                expect(onOpen).toHaveBeenCalledTimes(1);
            });

            expect(onOpen).toHaveBeenCalledWith();
            expect(onChange).toHaveBeenCalledTimes(0);
        });
    });

    describe('when clear button is hit', () => {
        it('act clear search and open', async () => {
            const onOpen = jest.fn();
            const onChange = jest.fn();
            renderComponent({ ...baseProps, value: 'test value here', onOpen, onChange });

            expect(screen.getByDisplayValue('test value here'));

            const button = screen.getByText('Clear');
            await userEvent.click(button);

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            expect(onChange).toHaveBeenCalledWith('');
            expect(onOpen).toHaveBeenCalledTimes(1);
            expect(onOpen).toHaveBeenCalledWith();
        });
    });
});
