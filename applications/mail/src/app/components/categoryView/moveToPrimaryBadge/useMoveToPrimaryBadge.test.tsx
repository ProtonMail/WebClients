import { renderHook } from '@testing-library/react-hooks';

import { useVariant } from '@proton/unleash/useVariant';

import { selectShouldShowMoveToPrimaryBadge } from 'proton-mail/store/categories/categoriesSelector';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useMoveToPrimaryBadge } from './useMoveToPrimaryBadge';

jest.mock('@proton/unleash/useVariant');
jest.mock('proton-mail/store/hooks');

const mockUseVariant = jest.mocked(useVariant);
const mockUseMailSelector = jest.mocked(useMailSelector);

const mockBadgeShouldShow = (shouldShow: boolean) => {
    mockUseMailSelector.mockImplementation((selector) => {
        if (selector === selectShouldShowMoveToPrimaryBadge) {
            return shouldShow;
        }
        return undefined;
    });
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('useMoveToPrimaryBadge', () => {
    it('shows the badge when the variant is RecategorizationButton and the selector says to', () => {
        mockUseVariant.mockReturnValue({ name: 'RecategorizationButton' } as any);
        mockBadgeShouldShow(true);

        const { result } = renderHook(() => useMoveToPrimaryBadge());

        expect(result.current).toBe(true);
    });

    it('hides the badge when the variant is RecategorizationButton but the selector says no', () => {
        mockUseVariant.mockReturnValue({ name: 'RecategorizationButton' } as any);
        mockBadgeShouldShow(false);

        const { result } = renderHook(() => useMoveToPrimaryBadge());

        expect(result.current).toBe(false);
    });

    it('hides the badge on the RecategorizationNoButton variant even when the selector says to show it', () => {
        mockUseVariant.mockReturnValue({ name: 'RecategorizationNoButton' } as any);
        mockBadgeShouldShow(true);

        const { result } = renderHook(() => useMoveToPrimaryBadge());

        expect(result.current).toBe(false);
    });

    it('hides the badge when the flag is disabled', () => {
        mockUseVariant.mockReturnValue({ name: 'disabled' } as any);
        mockBadgeShouldShow(true);

        const { result } = renderHook(() => useMoveToPrimaryBadge());

        expect(result.current).toBe(false);
    });
});
