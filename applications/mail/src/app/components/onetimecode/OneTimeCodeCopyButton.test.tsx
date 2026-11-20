import { act } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import OneTimeCodeCopyButton from './OneTimeCodeCopyButton';

const mockCreateNotification = vi.fn();

vi.mock('@proton/app-context/useNotifications', () => {
    return {
        useNotifications: () => {
            return { createNotification: mockCreateNotification };
        },
    };
});

vi.mock('@proton/shared/lib/helpers/browser', async () => {
    return {
        ...(await vi.importActual('@proton/shared/lib/helpers/browser')),
        textToClipboard: vi.fn(),
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
        vi.advanceTimersByTime(ms);
    });
};

describe('OneTimeCodeCopyButton', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('copies the code, notifies and swaps the copy icon for a checkmark', () => {
        renderButton(vi.fn());

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

    it('fires onCopy once, on the click', () => {
        const onCopy = vi.fn();
        renderButton(onCopy);

        clickButton();
        expect(onCopy).toHaveBeenCalledTimes(1);

        advance(1000);
        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('returns to the copy icon one second after the click', () => {
        renderButton(vi.fn());

        clickButton();
        advance(999);
        expect(screen.getByTestId('otp-copy-button:copied-icon')).toBeInTheDocument();

        advance(1);
        expect(screen.getByTestId('otp-copy-button:copy-icon')).toBeInTheDocument();
    });

    it('ignores a second click while in the copied state', () => {
        const onCopy = vi.fn();
        renderButton(onCopy);

        clickButton();
        clickButton();
        advance(1000);

        expect(onCopy).toHaveBeenCalledTimes(1);
        expect(textToClipboard).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });

    it('still forwards a click made while in the copied state to onClick', () => {
        const onClick = vi.fn();
        render(<OneTimeCodeCopyButton code={CODE} onClick={onClick} />);

        clickButton();
        clickButton();

        expect(onClick).toHaveBeenCalledTimes(2);
    });
});
