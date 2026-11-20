import type { Mock, MockedFunction } from 'vitest';

import type { DownloadController, NodeEntity } from '@proton/drive/sdk';

import { validateDownloadSignatures } from './handleDownloadCompletion';
import { checkMetadataSignature, handleManifestSignatureError } from './validateSignatures';

vi.mock('./validateSignatures');

const mockCheckMetadataSignature = checkMetadataSignature as MockedFunction<typeof checkMetadataSignature>;
const mockHandleManifestSignatureError = handleManifestSignatureError as MockedFunction<
    typeof handleManifestSignatureError
>;

describe('validateDownloadSignatures', () => {
    const downloadId = 'test-id';
    const node = { uid: 'node-uid', name: { ok: true as const, value: 'test.txt' } } as unknown as NodeEntity;

    const setupMocks = () => {
        const mockController = {
            completion: vi.fn().mockResolvedValue(undefined),
            isDownloadCompleteWithSignatureIssues: vi.fn().mockReturnValue(false),
        } as unknown as DownloadController;

        const mockOnApproved = vi.fn();
        const mockOnRejected = vi.fn();
        const mockOnError = vi.fn();

        mockCheckMetadataSignature.mockImplementation(async (_id, _node, completionCallback) => {
            await completionCallback();
        });
        mockHandleManifestSignatureError.mockResolvedValue(undefined);

        return { mockController, mockOnApproved, mockOnRejected, mockOnError };
    };

    beforeEach(() => vi.clearAllMocks());

    it('should complete successfully with signature validation', async () => {
        const mocks = setupMocks();

        await validateDownloadSignatures({
            downloadId,
            node,
            controller: mocks.mockController,
            onApproved: mocks.mockOnApproved,
            onRejected: mocks.mockOnRejected,
        });

        expect(mockCheckMetadataSignature).toHaveBeenCalledWith(
            downloadId,
            node,
            expect.any(Function),
            mocks.mockOnRejected
        );
        expect(mocks.mockController.completion).toHaveBeenCalled();
        expect(mocks.mockOnApproved).toHaveBeenCalled();
    });

    it('should handle manifest signature errors', async () => {
        const mocks = setupMocks();
        mockCheckMetadataSignature.mockRejectedValue(new Error('Signature failed'));
        (mocks.mockController.isDownloadCompleteWithSignatureIssues as Mock).mockReturnValue(true);

        await validateDownloadSignatures({
            downloadId,
            node,
            controller: mocks.mockController,
            onApproved: mocks.mockOnApproved,
            onRejected: mocks.mockOnRejected,
        });

        expect(mockHandleManifestSignatureError).toHaveBeenCalledWith(
            downloadId,
            node,
            mocks.mockOnApproved,
            mocks.mockOnRejected
        );
    });

    it('should call onError and rethrow for non-signature errors', async () => {
        const mocks = setupMocks();
        const error = new Error('Network error');
        mockCheckMetadataSignature.mockRejectedValue(error);

        await expect(
            validateDownloadSignatures({
                downloadId,
                node,
                controller: mocks.mockController,
                onApproved: mocks.mockOnApproved,
                onRejected: mocks.mockOnRejected,
                onError: mocks.mockOnError,
            })
        ).rejects.toThrow('Network error');

        expect(mocks.mockOnError).toHaveBeenCalledWith(error);
    });

    it('should rethrow errors when onError is not provided', async () => {
        const mocks = setupMocks();
        mockCheckMetadataSignature.mockRejectedValue(new Error('Network error'));

        await expect(
            validateDownloadSignatures({
                downloadId,
                node,
                controller: mocks.mockController,
                onApproved: mocks.mockOnApproved,
                onRejected: mocks.mockOnRejected,
            })
        ).rejects.toThrow('Network error');
    });
});
