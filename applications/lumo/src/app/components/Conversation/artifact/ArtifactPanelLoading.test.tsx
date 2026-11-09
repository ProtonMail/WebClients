import { act, render, screen } from '@testing-library/react';

import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';

import { ArtifactPanelLoading } from './ArtifactPanelLoading';

jest.mock('@proton/components/hooks/useReducedMotion', () => {
    return { useReducedMotion: jest.fn() };
});

const mockUseReducedMotion = jest.mocked(useReducedMotion);

const getIconMarkup = (container: HTMLElement) => {
    return container.querySelector('.artifact-panel-loading-icon')?.outerHTML;
};

describe('ArtifactPanelLoading', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('rotates the icon and label when motion is allowed', () => {
        mockUseReducedMotion.mockReturnValue(false);

        const { container } = render(<ArtifactPanelLoading />);
        const initialIcon = getIconMarkup(container);

        expect(screen.getByText('Creating…')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(4000);
        });
        act(() => {
            jest.runOnlyPendingTimers();
        });

        expect(getIconMarkup(container)).not.toBe(initialIcon);
        expect(screen.queryByText('Creating…')).not.toBeInTheDocument();
    });

    it('shows one static icon and label under reduced motion', () => {
        mockUseReducedMotion.mockReturnValue(true);

        const { container } = render(<ArtifactPanelLoading />);
        const initialIcon = getIconMarkup(container);

        expect(jest.getTimerCount()).toBe(0);

        act(() => {
            jest.advanceTimersByTime(20000);
        });

        expect(getIconMarkup(container)).toBe(initialIcon);
        expect(screen.getByText('Creating…')).toBeInTheDocument();
        expect(container.querySelector('[aria-busy="true"][aria-live="polite"]')).toBeInTheDocument();
    });

    it('does not exempt the skeleton bars from the reduced-motion reset', () => {
        mockUseReducedMotion.mockReturnValue(true);

        const { container } = render(<ArtifactPanelLoading />);

        expect(container.querySelectorAll('.rectangle-skeleton')).toHaveLength(4);
        expect(container.querySelector('.keep-motion')).not.toBeInTheDocument();
    });
});
