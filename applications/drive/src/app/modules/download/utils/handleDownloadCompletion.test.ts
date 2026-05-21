import type { DownloadController, NodeEntity } from '@proton/drive';

import { validateDownloadSignatures } from './handleDownloadCompletion';
import { checkMetadataSignature, handleManifestSignatureError } from './validateSignatures';

jest.mock('./validateSignatures');

const mockCheckMetadataSignature = checkMetadataSignature as jest.MockedFunction<typeof checkMetadataSignature>;
const mockHandleManifestSignatureError = handleManifestSignatureError as jest.MockedFunction<
    typeof handleManifestSignatureError
>;

describe('validateDownloadSignatures', () => {
    const downloadId = 'test-id';
    const node = { uid: 'node-uid', name: 'test.txt' } as NodeEntity;

    const setupMocks = () => {
        const mockController = {
            completion: jest.fn().mockResolvedValue(undefined),
            isDownloadCompleteWithSignatureIssues: jest.fn().mockReturnValue(false),
        } as unknown as DownloadController;

        const mockOnApproved = jest.fn();
        const mockOnRejected = jest.fn();
        const mockOnError = jest.fn();

        mockCheckMetadataSignature.mockImplementation(async (_id, _node, completionCallback) => {
            await completionCallback();
        });
        mockHandleManifestSignatureError.mockResolvedValue(undefined);

        return { mockController, mockOnApproved, mockOnRejected, mockOnError };
    };

    beforeEach(() => jest.clearAllMocks());

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
        (mocks.mockController.isDownloadCompleteWithSignatureIssues as jest.Mock).mockReturnValue(true);

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
