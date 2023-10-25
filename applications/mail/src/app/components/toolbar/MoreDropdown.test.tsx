import { fireEvent, render } from '@testing-library/react';

import useSnooze from '../../hooks/actions/useSnooze';
import { useLabelActions } from '../../hooks/useLabelActions';
import MoreDropdown from './MoreDropdown';

jest.mock('../../hooks/useLabelActions');
jest.mock('../../hooks/actions/useSnooze');
jest.mock('../../hooks/actions/useEmptyLabel', () => ({
    useEmptyLabel: () => ({ emptyLabel: '', modal: null }),
}));
jest.mock('../../hooks/actions/useMoveAll', () => ({
    useMoveAll: () => ({ moveAll: '', modal: null }),
}));

const BREAKPOINTS = {
    breakpoint: '',
    isLargeDesktop: false,
    isMediumDesktop: false,
    isSmallDesktop: false,
    isDesktop: false,
    isTablet: false,
    isMobile: false,
    isTinyMobile: false,
    isNarrow: false,
};

const props = {
    labelID: '1',
    elementIDs: [''],
    selectedIDs: ['a', 'b'],
    isSearch: false,
    isNarrow: false,
    isTiny: false,
    isExtraTiny: false,
    onMove: jest.fn(),
    onDelete: jest.fn(),
    breakpoints: BREAKPOINTS,
};

const isTinyProps = {
    ...props,
    isTiny: true,
};

const isExtraTinyProps = {
    ...props,
    isExtraTiny: true,
};

const isNarrowProps = {
    ...props,
    isNarrow: true,
};

describe('MoreDropdown', () => {
    const useSnoozeMock = useSnooze as jest.Mock;
    const useLabelActionMock = useLabelActions as jest.Mock;
    beforeAll(() => {
        useLabelActionMock.mockReturnValue([[''], ['']]);
        useSnoozeMock.mockReturnValue({
            isSnoozeEnabled: true,
            canSnooze: jest.fn(),
            canUnsnooze: jest.fn(),
        });
    });
    afterAll(() => {
        useLabelActionMock.mockReset();
        useSnoozeMock.mockReset();
    });

    it('should contain all option in more when screen is tiny', () => {
        const { getByTestId } = render(<MoreDropdown {...isTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(getByTestId('toolbar:more-dropdown--moveto'));
        expect(getByTestId('toolbar:more-dropdown--labelas'));
        expect(getByTestId('toolbar:more-dropdown--snooze'));
    });

    it('should contain no option in more when all breakpoints are false', () => {
        const { getByTestId, queryByTestId } = render(<MoreDropdown {...props} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen narrow', () => {
        const { getByTestId, queryByTestId } = render(<MoreDropdown {...isNarrowProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen is extra tiny', () => {
        const { getByTestId, queryByTestId } = render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should have move and label action when snooze is disabled and screen tiny', () => {
        useSnoozeMock.mockReturnValue({
            isSnoozeEnabled: false,
            canSnooze: jest.fn(),
            canUnsnooze: jest.fn(),
        });

        const { getByTestId } = render(<MoreDropdown {...isTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(getByTestId('toolbar:more-dropdown--moveto'));
        expect(getByTestId('toolbar:more-dropdown--labelas'));
    });

    it('should have all move actions returned by useLabelAction hook', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        const { getByTestId } = render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(getByTestId('toolbar:more-dropdown--movetonospam'));
        expect(getByTestId('toolbar:more-dropdown--movetonoarchive'));
        expect(getByTestId('toolbar:more-dropdown--movetotrash'));
        expect(getByTestId('toolbar:more-dropdown--movetospam'));
        expect(getByTestId('toolbar:more-dropdown--delete'));
    });

    it('should have only move actions returned by useLabelAction hook', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'error'], ['not real']]);

        const { getByTestId } = render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(getByTestId('toolbar:more-dropdown--movetotrash'));
    });

    it('should have no move actions when screen is not extra tiny', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        const { getByTestId, queryByTestId } = render(<MoreDropdown {...isTinyProps} />);
        const moreButton = getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(queryByTestId('toolbar:more-dropdown--movetoinbox')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--movetonospam')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--movetonoarchive')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--movetotrash')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--movetospam')).toBeNull();
        expect(queryByTestId('toolbar:more-dropdown--delete')).toBeNull();
    });
});
