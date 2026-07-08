import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmptyFileDecision, uploadManager } from '@proton/drive/modules/upload';

import { EmptyFileConfirmModal } from './EmptyFileConfirmModal';

describe('EmptyFileConfirmModal', () => {
    let capturedResolver: ((fileNames: string[]) => Promise<EmptyFileDecision>) | undefined;

    beforeEach(() => {
        capturedResolver = undefined;
        jest.spyOn(uploadManager, 'setEmptyFileResolver').mockImplementation((callback) => {
            capturedResolver = callback;
        });
        jest.spyOn(uploadManager, 'removeEmptyFileResolver').mockImplementation(() => {
            capturedResolver = undefined;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** Lets pending state updates and the modal's mount/exit effects settle. */
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    /**
     * Simulates the upload manager detecting empty files. Returns the pending decision
     * wrapped in an object so awaiting this helper doesn't accidentally await the decision
     * itself (which only settles once the user interacts with the modal).
     */
    const promptFor = async (fileNames: string[]) => {
        if (!capturedResolver) {
            throw new Error('resolver was not registered');
        }
        let decision: Promise<EmptyFileDecision> | undefined;
        act(() => {
            decision = capturedResolver?.(fileNames);
        });
        await flush();
        expect(screen.getByText('Upload empty file?')).toBeInTheDocument();
        if (!decision) {
            throw new Error('resolver did not return a decision');
        }
        return { decision };
    };

    it('registers a resolver on mount and removes it on unmount', () => {
        const { unmount } = render(<EmptyFileConfirmModal />);

        expect(uploadManager.setEmptyFileResolver).toHaveBeenCalledTimes(1);
        expect(capturedResolver).toBeDefined();

        unmount();

        expect(uploadManager.removeEmptyFileResolver).toHaveBeenCalledTimes(1);
    });

    it('does not show the modal until an empty file is detected', () => {
        render(<EmptyFileConfirmModal />);

        expect(screen.queryByText('Upload empty file?')).not.toBeInTheDocument();
    });

    it('shows the detected file names when prompted', async () => {
        render(<EmptyFileConfirmModal />);

        await promptFor(['budget.xlsx', 'notes.txt']);

        expect(screen.getByText('budget.xlsx')).toBeInTheDocument();
        expect(screen.getByText('notes.txt')).toBeInTheDocument();
    });

    it('uses singular wording for a single file', async () => {
        render(<EmptyFileConfirmModal />);

        await promptFor(['lonely.txt']);

        expect(screen.getByText('This file appears to be empty:')).toBeInTheDocument();
        expect(screen.getByText('Do you still want to upload it?')).toBeInTheDocument();
    });

    it('uses plural wording for multiple files', async () => {
        render(<EmptyFileConfirmModal />);

        await promptFor(['a.txt', 'b.txt']);

        expect(screen.getByText('These files appear to be empty:')).toBeInTheDocument();
        expect(screen.getByText('Do you still want to upload them?')).toBeInTheDocument();
    });

    it('resolves with Allow when confirming the upload', async () => {
        render(<EmptyFileConfirmModal />);
        const { decision } = await promptFor(['a.txt']);

        await userEvent.click(screen.getByText('Upload anyway'));

        await expect(decision).resolves.toBe(EmptyFileDecision.Allow);
    });

    it('resolves with Skip when skipping', async () => {
        render(<EmptyFileConfirmModal />);
        const { decision } = await promptFor(['a.txt']);

        await userEvent.click(screen.getByText('Skip'));

        await expect(decision).resolves.toBe(EmptyFileDecision.Skip);
    });

    it('resolves with Cancel when dismissing the modal', async () => {
        render(<EmptyFileConfirmModal />);
        const { decision } = await promptFor(['a.txt']);

        await userEvent.click(screen.getByTestId('modal:close'));

        await expect(decision).resolves.toBe(EmptyFileDecision.Cancel);
    });

    it('keeps prompts independent across successive detections', async () => {
        render(<EmptyFileConfirmModal />);
        const first = await promptFor(['a.txt']);

        await userEvent.click(screen.getByText('Upload anyway'));
        await expect(first.decision).resolves.toBe(EmptyFileDecision.Allow);
        await flush();

        const second = await promptFor(['b.txt']);
        await userEvent.click(screen.getByText('Skip'));
        await expect(second.decision).resolves.toBe(EmptyFileDecision.Skip);
    });
});
