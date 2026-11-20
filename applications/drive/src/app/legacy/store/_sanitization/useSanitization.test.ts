import { renderHook } from '@testing-library/react';

import {
    queryListNodesWithMissingNodeHashKeys,
    querySendNodesWithNewNodeHashKeys,
} from '@proton/shared/lib/api/drive/sanitization';
import { generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { verifyAllWhenMocksCalled, when } from '../../../utils/tests/when';
import { useDebouncedRequest } from '../_api';
import { useLink } from '../_links';
import { useSanitization } from './useSanitization';

vi.mock('../_api');
const mockedDebounceRequest = vi.fn().mockResolvedValue(true);
vi.mocked(useDebouncedRequest).mockReturnValue(mockedDebounceRequest);

vi.mock('@proton/shared/lib/api/drive/sanitization');

vi.mock('../_links');
const mockedGetPrivateKey = vi.fn();
vi.mocked(useLink).mockReturnValue({
    getLinkPrivateKey: mockedGetPrivateKey,
} as any);

vi.mock('@proton/shared/lib/keys/driveKeys');
const mockedGenerateNodeHashKey = vi.mocked(generateNodeHashKey);

describe('useSanitization', () => {
    let originalConsoleWarn: Console['warn'];

    beforeAll(() => {
        // Store the original console.warn
        originalConsoleWarn = console.warn;

        // Mock console.warn
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore the original console.warn
        console.warn = originalConsoleWarn;
        verifyAllWhenMocksCalled();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('restoreHashKey', () => {
        it('should restore missing node hash keys', async () => {
            const nodesWithMissingHashKey = [
                {
                    LinkID: 'link1',
                    ShareID: 'share1',
                    VolumeID: 'volume1',
                    PGPArmoredEncryptedNodeHashKey: '',
                },
            ];

            const linkPrivateKey = 'linkPrivateKey';
            const generatedHashKey = { NodeHashKey: 'newHashKey' };

            when(mockedDebounceRequest)
                .calledWith(queryListNodesWithMissingNodeHashKeys(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ NodesWithMissingNodeHashKey: nodesWithMissingHashKey });

            when(mockedGetPrivateKey)
                .calledWith(
                    expect.any(AbortSignal),
                    nodesWithMissingHashKey[0].ShareID,
                    nodesWithMissingHashKey[0].LinkID
                )
                .mockResolvedValueOnce(linkPrivateKey);

            mockedGenerateNodeHashKey.mockResolvedValueOnce(generatedHashKey);

            when(mockedDebounceRequest)
                .calledWith(
                    querySendNodesWithNewNodeHashKeys({
                        NodesWithMissingNodeHashKey: [
                            {
                                ...nodesWithMissingHashKey[0],
                                PGPArmoredEncryptedNodeHashKey: generatedHashKey.NodeHashKey,
                            },
                        ],
                    }),
                    expect.any(AbortSignal)
                )
                .mockResolvedValueOnce({ Code: 1000 });

            const { result } = renderHook(() => useSanitization());
            await result.current.restoreHashKey();

            expect(mockedGenerateNodeHashKey).toHaveBeenCalledWith(linkPrivateKey, linkPrivateKey);
            expect(mockedDebounceRequest).toHaveBeenCalledWith(
                querySendNodesWithNewNodeHashKeys({
                    NodesWithMissingNodeHashKey: [
                        {
                            ...nodesWithMissingHashKey[0],
                            PGPArmoredEncryptedNodeHashKey: generatedHashKey.NodeHashKey,
                        },
                    ],
                }),
                expect.any(AbortSignal)
            );
        });

        it('should handle empty list of nodes with missing hash keys', async () => {
            when(mockedDebounceRequest)
                .calledWith(queryListNodesWithMissingNodeHashKeys(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ NodesWithMissingNodeHashKey: [] });

            const { result } = renderHook(() => useSanitization());
            await result.current.restoreHashKey();

            expect(mockedGenerateNodeHashKey).not.toHaveBeenCalled();
            expect(mockedDebounceRequest).toHaveBeenCalledTimes(1);
        });
    });
});
