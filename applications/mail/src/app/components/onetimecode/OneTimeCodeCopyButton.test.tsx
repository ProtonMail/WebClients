import { act } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import OneTimeCodeCopyButton from './OneTimeCodeCopyButton';

const mockCreateNotification = jest.fn();

jest.mock('@proton/app-context/useNotifications', () => {
    return {
        useNotifications: () => {
            return { createNotification: mockCreateNotification };
        },
    };
});

jest.mock('@proton/shared/lib/helpers/browser', () => {
    return {
        ...jest.requireActual('@proton/shared/lib/helpers/browser'),
        textToClipboard: jest.fn(),
    };
});

const CODE = '482913';

const renderButton = (onCopy: () => void) => {
    return render(<OneTimeCodeCopyButton code={CODE} onCopy={onCopy} />);
};

const clickButton = () => {
    fireEvent.click(screen.getByRole('button'));
};

const advance = (ms: number) => {
    act(() => {
        jest.advanceTimersByTime(ms);
    });
};

describe('OneTimeCodeCopyButton', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('copies the code, notifies and swaps the copy icon for a checkmark', () => {
        renderButton(jest.fn());

        clickButton();

        expect(textToClipboard).toHaveBeenCalledWith(CODE);
        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('otp-copy-button:copied-icon')).toBeInTheDocument();
    });

    it('shows codeContent but copies code', () => {
        render(<OneTimeCodeCopyButton code={CODE} codeContent={<mark>4829</mark>} />);

        clickButton();

        expect(screen.getByText('4829')).toBeInTheDocument();
        expect(textToClipboard).toHaveBeenCalledWith(CODE);
    });

    it('fires onCopy once, one second after the click', () => {
        const onCopy = jest.fn();
        renderButton(onCopy);

        clickButton();
        advance(999);
        expect(onCopy).not.toHaveBeenCalled();

        advance(1);
        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('ignores a second click while in the copied state', () => {
        const onCopy = jest.fn();
        renderButton(onCopy);

        clickButton();
        clickButton();
        advance(1000);

        expect(onCopy).toHaveBeenCalledTimes(1);
        expect(textToClipboard).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });

    it('still forwards a click made while in the copied state to onClick', () => {
        const onClick = jest.fn();
        render(<OneTimeCodeCopyButton code={CODE} onClick={onClick} />);

        clickButton();
        clickButton();

        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('never fires onCopy when unmounted before the delay ends', () => {
        const onCopy = jest.fn();
        const { unmount } = renderButton(onCopy);

        clickButton();
        unmount();
        advance(1000);

        expect(onCopy).not.toHaveBeenCalled();
    });
});
