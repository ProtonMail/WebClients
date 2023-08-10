import { render, screen } from '@testing-library/react';
import { getUnixTime, subDays } from 'date-fns';

import * as spotlightModule from '@proton/components/components/spotlight/Spotlight';
import * as useDriveWindowsGASpotlightModule from '@proton/components/hooks/useDriveWindowsGASpotlight';
import * as useFeatureModule from '@proton/components/hooks/useFeature';
import * as useSpotlightOnFeatureModule from '@proton/components/hooks/useSpotlightOnFeature';
import * as useWelcomeFlagsModule from '@proton/components/hooks/useWelcomeFlags';
import * as browserHelpersModule from '@proton/shared/lib/helpers/browser';
import {
    SpotlightMock,
    mockUseActiveBreakpoint,
    mockUseFeature,
    mockUseSpotlightOnFeature,
    mockUseUser,
} from '@proton/testing/index';
import noop from '@proton/utils/noop';

import MailSidebarDriveSpotlight from './MailSidebarDriveSpotlight';

describe('MailSidebarDriveSpotlight', () => {
    const spotlightMock = jest.spyOn(spotlightModule, 'default');
    const useWelcomeFlagsMock = jest.spyOn(useWelcomeFlagsModule, 'default');
    const useFeatureMock = jest.spyOn(useFeatureModule, 'default');
    const useSpotlightOnFeatureMock = jest.spyOn(useSpotlightOnFeatureModule, 'default');
    const useDriveWindowsGASpotlightMock = jest.spyOn(useDriveWindowsGASpotlightModule, 'useDriveWindowsGASpotlight');
    const isWindows = jest.spyOn(browserHelpersModule, 'isWindows');

    beforeEach(() => {
        isWindows.mockReturnValue(true);
        spotlightMock.mockImplementation(SpotlightMock);
        useWelcomeFlagsMock.mockReturnValue([
            { isDone: true, hasGenericWelcomeStep: false, isWelcomeFlow: false },
            noop,
        ]);
        useDriveWindowsGASpotlightMock.mockReturnValue([
            {
                show: true,
                content: 'spotlight',
                originalPlacement: 'bottom',
                size: 'large',
                onClose: noop,
            },
            noop,
        ]);
        mockUseActiveBreakpoint({ isNarrow: false });
        mockUseFeature({ feature: { Value: true } });
        mockUseSpotlightOnFeature({ show: true });
        mockUseUser([
            {
                CreateTime: getUnixTime(subDays(new Date(), 2)),
            },
            false,
        ]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const setup = () => {
        return render(
            <MailSidebarDriveSpotlight
                renderDropdown={(hideSpotlight) => <div onClick={hideSpotlight}>{'content'}</div>}
            />
        );
    };

    it('Should render child and spotlight', () => {
        setup();

        // Ensure we call the right FF in first call
        expect(useFeatureMock.mock.calls[0][0]).toBe('DriveWindowsGAMailSpotlightShown');

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.getByText('spotlight')).toBeInTheDocument();
    });

    it('Should not render spotlight when feature flag is false', () => {
        useFeatureMock.mockReturnValue({ feature: { Value: false } } as any);

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });

    it('Should not render spotlight when feature flag has been displayed', () => {
        useSpotlightOnFeatureMock.mockReturnValue({ show: false, onDisplayed: () => {}, onClose: () => {} });

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });

    it('Should not render spotlight when feature is not on windows', () => {
        isWindows.mockReturnValue(false);

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });

    it('Should not render spotlight when user created account less than two days ago', () => {
        mockUseUser([
            {
                CreateTime: getUnixTime(subDays(new Date(), 1)),
            },
            false,
        ]);

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });

    it('Should not render spotlight when user is on mobile screen', () => {
        mockUseActiveBreakpoint({ isNarrow: true });

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });
});
