import { render, screen } from '@testing-library/react';
import { getUnixTime, subDays } from 'date-fns';

import * as useWelcomeFlagsModule from '@proton/account/welcomeFlags';
import * as spotlightModule from '@proton/components/components/spotlight/Spotlight';
import * as useSpotlightOnFeatureModule from '@proton/components/hooks/useSpotlightOnFeature';
import * as useFeatureModule from '@proton/features/useFeature';
import {
    SpotlightMock,
    mockUseActiveBreakpoint,
    mockUseFeature,
    mockUseSpotlightOnFeature,
    mockUseUser,
} from '@proton/testing/index';
import noop from '@proton/utils/noop';

import SecurityCenterSpotlight from './SecurityCenterSpotlight';

describe('SecurityCenterSpotlight', () => {
    const spotlightMock = jest.spyOn(spotlightModule, 'default');
    const useWelcomeFlagsMock = jest.spyOn(useWelcomeFlagsModule, 'useWelcomeFlags');
    const useFeatureMock = jest.spyOn(useFeatureModule, 'default');
    const useSpotlightOnFeatureMock = jest.spyOn(useSpotlightOnFeatureModule, 'default');

    beforeEach(() => {
        spotlightMock.mockImplementation(SpotlightMock);
        useWelcomeFlagsMock.mockReturnValue([
            { isDone: true, hasGenericWelcomeStep: false, isWelcomeFlow: false },
            noop,
        ]);
        mockUseActiveBreakpoint();
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
            <SecurityCenterSpotlight>
                <div>{'content'}</div>
            </SecurityCenterSpotlight>
        );
    };

    it('Should render child and spotlight', () => {
        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.getByText('Create hide-my-email aliases and keep track of them here.')).toBeInTheDocument();
    });

    it('Should not render spotlight when feature flag is false', () => {
        useFeatureMock.mockReturnValue({ feature: { Value: false } } as any);

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });

    it('Should not render spotlight when feature flag has been displayed', () => {
        useSpotlightOnFeatureMock.mockReturnValue({
            show: false,
            onDisplayed: () => {},
            onClose: () => {},
        });

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
        mockUseActiveBreakpoint({ viewportWidth: { ['<=small']: true } });

        setup();

        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.queryByText('spotlight')).toBe(null);
    });
});
