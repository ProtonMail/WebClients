import { fireEvent, screen } from '@testing-library/react';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import useSnooze from '../../hooks/actions/useSnooze';
import { useLabelActions } from '../../hooks/useLabelActions';
import MoreDropdown from './MoreDropdown';

jest.mock('../../hooks/useLabelActions');
jest.mock('../../hooks/actions/useSnooze');
jest.mock('../../hooks/actions/useEmptyLabel', () => ({
    useEmptyLabel: () => ({ emptyLabel: '', modal: null }),
}));
jest.mock('../../hooks/actions/move/useMoveAllToFolder', () => ({
    useMoveAllToFolder: () => ({ moveAllToFolder: '', selectAllMoveModal: null, moveAllModal: null }),
}));

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
    currentFolder: '0',
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
            canSnooze: jest.fn(),
            canUnsnooze: jest.fn(),
        });
    });
    afterAll(() => {
        useLabelActionMock.mockReset();
        useSnoozeMock.mockReset();
    });

    it('should contain all option in more when screen is tiny', async () => {
        await mailTestRender(<MoreDropdown {...isTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--moveto'));
        expect(screen.getByTestId('toolbar:more-dropdown--labelas'));
        expect(screen.getByTestId('toolbar:more-dropdown--snooze'));
    });

    it('should contain no option in more when all breakpoints are false', async () => {
        await mailTestRender(<MoreDropdown {...props} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen narrow', async () => {
        await mailTestRender(<MoreDropdown {...isNarrowProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen is extra tiny', async () => {
        await mailTestRender(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should have all move actions returned by useLabelAction hook', async () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        await mailTestRender(<MoreDropdown {...isExtraTinyProps} />);
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

        await mailTestRender(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetotrash'));
    });

    it('should have no move actions when screen is not extra tiny', async () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        await mailTestRender(<MoreDropdown {...isTinyProps} />);
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
