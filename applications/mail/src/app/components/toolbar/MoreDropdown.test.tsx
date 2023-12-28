import { fireEvent, screen } from '@testing-library/react';

import { render } from 'proton-mail/helpers/test/render';

import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';

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

const BREAKPOINTS = mockDefaultBreakpoints;

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

    it('should contain all option in more when screen is tiny', async () => {
        await render(<MoreDropdown {...isTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--moveto'));
        expect(screen.getByTestId('toolbar:more-dropdown--labelas'));
        expect(screen.getByTestId('toolbar:more-dropdown--snooze'));
    });

    it('should contain no option in more when all breakpoints are false', async () => {
        await render(<MoreDropdown {...props} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen narrow', async () => {
        await render(<MoreDropdown {...isNarrowProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen is extra tiny', async () => {
        await render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should have move and label action when snooze is disabled and screen tiny', async () => {
        useSnoozeMock.mockReturnValue({
            isSnoozeEnabled: false,
            canSnooze: jest.fn(),
            canUnsnooze: jest.fn(),
        });

        await render(<MoreDropdown {...isTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--moveto'));
        expect(screen.getByTestId('toolbar:more-dropdown--labelas'));
    });

    it('should have all move actions returned by useLabelAction hook', async () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        await render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetonospam'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetonoarchive'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetotrash'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetospam'));
        expect(screen.getByTestId('toolbar:more-dropdown--delete'));
    });

    it('should have only move actions returned by useLabelAction hook', async () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'error'], ['not real']]);

        await render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetotrash'));
    });

    it('should have no move actions when screen is not extra tiny', async () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        await render(<MoreDropdown {...isTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--movetoinbox')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--movetonospam')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--movetonoarchive')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--movetotrash')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--movetospam')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--delete')).toBeNull();
    });
});
