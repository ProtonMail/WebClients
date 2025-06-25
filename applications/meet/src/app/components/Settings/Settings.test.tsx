import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MeetContextValues } from '../../contexts/MeetContext';
import { MeetContext } from '../../contexts/MeetContext';
import { MeetingSideBars } from '../../types';
import { Settings } from './Settings';

vi.mock('../../hooks/useLocalParticipantResolution', () => ({
    useLocalParticipantResolution: vi.fn().mockReturnValue({
        resolution: '1080p',
        handleResolutionChange: vi.fn(),
    }),
}));

const mockContextValues = {
    sideBarState: {
        [MeetingSideBars.Settings]: true,
    },
    selfView: true,
    setSelfView: vi.fn(),
    shouldShowConnectionIndicator: false,
    setShouldShowConnectionIndicator: vi.fn(),
};

const Wrapper = ({
    children,
    contextValue = {},
}: {
    children: React.ReactNode;
    contextValue?: Partial<MeetContextValues>;
}) => {
    return (
        // @ts-expect-error - contextValue is a partial MeetContextValues
        <MeetContext.Provider value={{ ...mockContextValues, ...contextValue }}>{children}</MeetContext.Provider>
    );
};

describe('Settings', () => {
    it('should have the correct title', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have the correct options', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
        expect(screen.getByText('Hide self view')).toBeInTheDocument();
        expect(screen.getByText('Show meeting timer')).toBeInTheDocument();
        expect(screen.getByText('Show connection indicator')).toBeInTheDocument();
        expect(screen.getByText('Desktop notifications')).toBeInTheDocument();
    });

    it('should allow for toggling the self view', async () => {
        const setSelfView = vi.fn();

        render(
            <Wrapper contextValue={{ setSelfView }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const hideSelfViewCheckbox = screen.getByRole('checkbox', { name: 'Hide self view' });
        await user.click(hideSelfViewCheckbox);

        expect(setSelfView).toHaveBeenCalledWith(!mockContextValues.selfView);
    });

    it('should allow for toggling the connection indicator', async () => {
        const setShouldShowConnectionIndicator = vi.fn();

        render(
            <Wrapper contextValue={{ setShouldShowConnectionIndicator }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const showConnectionIndicatorCheckbox = screen.getByRole('checkbox', { name: 'Show connection indicator' });
        await user.click(showConnectionIndicatorCheckbox);

        expect(setShouldShowConnectionIndicator).toHaveBeenCalledWith(!mockContextValues.shouldShowConnectionIndicator);
    });
});
