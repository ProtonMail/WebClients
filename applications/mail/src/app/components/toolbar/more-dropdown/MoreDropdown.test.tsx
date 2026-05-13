import { fireEvent, render, screen } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useMailSelector } from 'proton-mail/store/hooks';

import useSnooze from '../../../hooks/actions/useSnooze';
import { useLabelActions } from '../../../hooks/useLabelActions';
import { MoreDropdown } from './MoreDropdown';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);

jest.mock('proton-mail/store/hooks');
jest.mocked(useMailSelector).mockReturnValue(MAILBOX_LABEL_IDS.INBOX);

jest.mock('proton-mail/hooks/useSelectAll', () => ({
    useSelectAll: () => ({ selectAll: false }),
}));

jest.mock('proton-mail/hooks/useLabelActions');
jest.mock('proton-mail/hooks/actions/useSnooze');
jest.mock('proton-mail/hooks/actions/useEmptyLabel', () => ({
    useEmptyLabel: () => ({ emptyLabel: '', modal: null }),
}));
jest.mock('proton-mail/hooks/actions/move/useMoveAllToFolder', () => ({
    useMoveAllToFolder: () => ({ moveAllToFolder: '', selectAllMoveModal: null, moveAllModal: null }),
}));

const props = {
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

    it('should contain all option in more when screen is tiny', () => {
        render(<MoreDropdown {...isTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--moveto'));
        expect(screen.getByTestId('toolbar:more-dropdown--labelas'));
        expect(screen.getByTestId('toolbar:more-dropdown--snooze'));
    });

    it('should contain no option in more when all breakpoints are false', () => {
        render(<MoreDropdown {...props} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen narrow', () => {
        render(<MoreDropdown {...isNarrowProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should contain no option in more when screen is extra tiny', () => {
        render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.queryByTestId('toolbar:more-dropdown--moveto')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--labelas')).toBeNull();
        expect(screen.queryByTestId('toolbar:more-dropdown--snooze')).toBeNull();
    });

    it('should have all move actions returned by useLabelAction hook', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetonospam'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetonoarchive'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetotrash'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetospam'));
        expect(screen.getByTestId('toolbar:more-dropdown--delete'));
    });

    it('should have only move actions returned by useLabelAction hook', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'error'], ['not real']]);

        render(<MoreDropdown {...isExtraTinyProps} />);
        const moreButton = screen.getByTestId('toolbar:more-dropdown');
        fireEvent.click(moreButton);

        expect(screen.getByTestId('toolbar:more-dropdown--movetoinbox'));
        expect(screen.getByTestId('toolbar:more-dropdown--movetotrash'));
    });

    it('should have no move actions when screen is not extra tiny', () => {
        useLabelActionMock.mockReturnValue([['inbox', 'trash', 'archive', 'spam', 'nospam', 'delete'], ['']]);

        render(<MoreDropdown {...isTinyProps} />);
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
