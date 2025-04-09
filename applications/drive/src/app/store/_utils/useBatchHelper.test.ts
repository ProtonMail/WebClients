import { renderHook } from '@testing-library/react';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import usePreventLeave from '@proton/components/hooks/usePreventLeave';
import { API_CODES } from '@proton/shared/lib/constants';
import { BATCH_REQUEST_SIZE } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import chunk from '@proton/utils/chunk';

import { useDebouncedRequest } from '../_api';
import { useBatchHelper } from './useBatchHelper';

jest.mock('@proton/components/hooks/usePreventLeave', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const preventLeaveMock = jest.fn((fn) => fn);
jest.mocked(usePreventLeave).mockReturnValue({ preventLeave: preventLeaveMock } as any);

jest.mock('@proton/shared/lib/helpers/runInQueue', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockedRunInQueue = jest.mocked(runInQueue).mockImplementation(async (queue) => {
    for (const task of queue) {
        await task();
    }
    return [];
});

jest.mock('@proton/utils/chunk', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockedChunk = jest.mocked(chunk);

jest.mock('../_api', () => ({
    useDebouncedRequest: jest.fn(),
}));
const debouncedRequestMock = jest.fn();
jest.mocked(useDebouncedRequest).mockReturnValue(debouncedRequestMock);

const queryMock = jest.fn((batchLinkIds) => {
    return { batchLinkIds };
});

describe('useBatchHelper', () => {
    const abortSignal = new AbortController().signal;
    const linkIds = ['link1', 'link2', 'link3', 'link4'];

    beforeEach(() => {
        jest.clearAllMocks();

        when(mockedChunk)
            .calledWith(linkIds, BATCH_REQUEST_SIZE)
            .mockReturnValue([
                ['link1', 'link2'],
                ['link3', 'link4'],
            ]);
    });

    afterAll(() => {
        verifyAllWhenMocksCalled();
    });

    it('should process batches correctly with successful requests', async () => {
        const { result } = renderHook(() => useBatchHelper());
        const batchHelper = result.current;

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link1', 'link2'] }, abortSignal)
            .mockResolvedValue({
                Responses: [
                    { LinkID: 'link1', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link2', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                ],
            });

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link3', 'link4'] }, abortSignal)
            .mockResolvedValue({
                Responses: [
                    { LinkID: 'link3', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link4', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                ],
            });

        const response = await batchHelper(abortSignal, {
            linkIds,
            query: queryMock,
            request: debouncedRequestMock,
        });

        expect(mockedChunk).toHaveBeenCalledWith(linkIds, BATCH_REQUEST_SIZE);
        expect(mockedRunInQueue).toHaveBeenCalled();
        expect(preventLeaveMock).toHaveBeenCalled();
        expect(queryMock).toHaveBeenCalledTimes(2);
        expect(queryMock).toHaveBeenCalledWith(['link1', 'link2']);
        expect(queryMock).toHaveBeenCalledWith(['link3', 'link4']);
        expect(debouncedRequestMock).toHaveBeenCalledTimes(2);

        expect(response.successes).toEqual(['link1', 'link2', 'link3', 'link4']);
        expect(response.failures).toEqual({});
    });

    it('should handle request failures correctly', async () => {
        const { result } = renderHook(() => useBatchHelper());
        const batchHelper = result.current;

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link1', 'link2'] }, abortSignal)
            .mockRejectedValue(new Error('Request failed'));

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link3', 'link4'] }, abortSignal)
            .mockResolvedValue({
                Responses: [
                    { LinkID: 'link3', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link4', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                ],
            });

        const response = await batchHelper(abortSignal, {
            linkIds,
            query: queryMock,
            request: debouncedRequestMock,
        });

        expect(response.successes).toEqual(['link3', 'link4']);
        expect(response.failures).toEqual({
            link1: new Error('Request failed'),
            link2: new Error('Request failed'),
        });
    });

    it('should respect custom batch size and max parallel requests', async () => {
        const { result } = renderHook(() => useBatchHelper());
        const batchHelper = result.current;

        const customBatchSize = 1;
        const customMaxParallelRequests = 2;

        when(mockedChunk)
            .calledWith(linkIds, customBatchSize)
            .mockReturnValue([['link1'], ['link2'], ['link3'], ['link4']]);

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link1'] }, abortSignal)
            .mockResolvedValue({
                Responses: [{ LinkID: 'link1', Response: { Code: API_CODES.SINGLE_SUCCESS } }],
            });

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link2'] }, abortSignal)
            .mockResolvedValue({
                Responses: [{ LinkID: 'link2', Response: { Code: API_CODES.SINGLE_SUCCESS } }],
            });

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link3'] }, abortSignal)
            .mockResolvedValue({
                Responses: [{ LinkID: 'link3', Response: { Code: API_CODES.SINGLE_SUCCESS } }],
            });

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link4'] }, abortSignal)
            .mockResolvedValue({
                Responses: [{ LinkID: 'link4', Response: { Code: API_CODES.SINGLE_SUCCESS } }],
            });

        await batchHelper(abortSignal, {
            linkIds,
            query: queryMock,
            batchRequestSize: customBatchSize,
            maxParallelRequests: customMaxParallelRequests,
            request: debouncedRequestMock,
        });

        expect(mockedChunk).toHaveBeenCalledWith(linkIds, customBatchSize);
        expect(mockedRunInQueue).toHaveBeenCalledWith(expect.any(Array), customMaxParallelRequests);
        expect(queryMock).toHaveBeenCalledTimes(4);
    });

    it('should use provided request function instead of debouncedRequest if specified', async () => {
        const { result } = renderHook(() => useBatchHelper());
        const batchHelper = result.current;

        const customRequestMock = jest.fn();

        customRequestMock.mockImplementationOnce(async () => {
            return Promise.resolve({
                Responses: [
                    { LinkID: 'link1', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link2', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                ],
            });
        });

        customRequestMock.mockImplementationOnce(async () => {
            return Promise.resolve({
                Responses: [
                    { LinkID: 'link3', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link4', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                ],
            });
        });

        await batchHelper(abortSignal, {
            linkIds,
            query: queryMock,
            request: customRequestMock,
        });

        expect(customRequestMock).toHaveBeenCalledTimes(2);
        expect(debouncedRequestMock).not.toHaveBeenCalled();
    });

    it('should consider allowedCodes as successful responses', async () => {
        const { result } = renderHook(() => useBatchHelper());
        const batchHelper = result.current;

        const CUSTOM_CODE_1 = 1001;
        const CUSTOM_CODE_2 = 1002;

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link1', 'link2'] }, abortSignal)
            .mockResolvedValue({
                Responses: [
                    { LinkID: 'link1', Response: { Code: API_CODES.SINGLE_SUCCESS } },
                    { LinkID: 'link2', Response: { Code: CUSTOM_CODE_1, Error: 'Custom code 1' } },
                ],
            });

        when(debouncedRequestMock)
            .calledWith({ batchLinkIds: ['link3', 'link4'] }, abortSignal)
            .mockResolvedValue({
                Responses: [
                    { LinkID: 'link3', Response: { Code: CUSTOM_CODE_2, Error: 'Custom code 2' } },
                    { LinkID: 'link4', Response: { Code: 9999, Error: 'Some error' } },
                ],
            });

        const response = await batchHelper(abortSignal, {
            linkIds,
            query: queryMock,
            request: debouncedRequestMock,
            allowedCodes: [CUSTOM_CODE_1, CUSTOM_CODE_2],
        });

        expect(response.successes).toEqual(['link1', 'link2', 'link3']);
        expect(response.failures).toEqual({
            link4: 'Some error',
        });
    });
});
