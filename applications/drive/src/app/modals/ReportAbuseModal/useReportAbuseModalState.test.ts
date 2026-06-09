import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import { NodeType } from '@proton/drive';
import { apiMock } from '@proton/testing/lib/api';
import { getStoreWrapper } from '@proton/testing/lib/context/renderWithProviders';

import { AbuseCategoryType } from './types';
import { type UseReportAbuseModalProps, useReportAbuseModalState } from './useReportAbuseModalState';

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

// A minimal MaybeNode that satisfies getNodeEntity and getNodeDisplaySize without mocking them.
const mockMaybeNode = {
    ok: true as const,
    value: {
        uid: 'node-uid',
        name: 'file.pdf',
        type: NodeType.File,
        mediaType: 'application/pdf',
        totalStorageSize: 1024,
        activeRevision: undefined,
    } as any,
};

const buildProps = (overrides?: Partial<UseReportAbuseModalProps>): UseReportAbuseModalProps => ({
    nodeUid: 'node-uid',
    publicLinkUrl: 'https://link',
    publicLinkPassword: 'pass',
    onClose: jest.fn(),
    onExit: jest.fn(),
    open: true,
    drive: {
        getNode: jest.fn().mockResolvedValue(mockMaybeNode),
        experimental: {
            getNodePassphrase: jest.fn().mockResolvedValue('passphrase'),
        },
    },
    ...overrides,
});

describe('useReportAbuseModalState', () => {
    const { Wrapper } = getStoreWrapper();

    afterEach(() => jest.clearAllMocks());

    it('returns loaded: false until node data is fetched', () => {
        const props = buildProps();
        const { result } = renderHook(() => useReportAbuseModalState(props), { wrapper: Wrapper });
        expect(result.current.loaded).toBe(false);
    });

    it('returns loaded: true with node name and size after fetch', async () => {
        const { result } = renderHook(() => useReportAbuseModalState(buildProps()), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.loaded).toBe(true));

        if (result.current.loaded) {
            expect(result.current.name).toBe('file.pdf');
            expect(result.current.size).toBe(1024);
            expect(result.current.mediaType).toBe('application/pdf');
        }
    });

    it('calls onExit when node fetch fails', async () => {
        const onExit = jest.fn();
        const props = buildProps({
            onExit,
            drive: {
                getNode: jest.fn().mockRejectedValue(new Error('not found')),
                experimental: { getNodePassphrase: jest.fn() },
            },
        });

        renderHook(() => useReportAbuseModalState(props), { wrapper: Wrapper });

        await waitFor(() => expect(onExit).toHaveBeenCalled());
    });

    it('calls the API with the report data on submit', async () => {
        const props = buildProps();
        const { result } = renderHook(() => useReportAbuseModalState(props), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.loaded).toBe(true));

        await act(async () => {
            if (result.current.loaded) {
                await result.current.handleSubmit({
                    category: AbuseCategoryType.Spam,
                    email: 'r@b.com',
                    comment: 'bad',
                });
            }
        });

        expect(props.drive.experimental.getNodePassphrase).toHaveBeenCalledWith('node-uid');
        expect(apiMock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'drive/report/url',
                data: expect.objectContaining({
                    AbuseCategory: AbuseCategoryType.Spam,
                    ReporterEmail: 'r@b.com',
                    ReporterMessage: 'bad',
                    ResourcePassphrase: 'passphrase',
                }),
            })
        );
    });

    it('passes prefilled values through to the view props', async () => {
        const prefilled = { category: AbuseCategoryType.Copyright, email: 'a@b.com' };
        const { result } = renderHook(() => useReportAbuseModalState(buildProps({ prefilled })), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.loaded).toBe(true));

        if (result.current.loaded) {
            expect(result.current.prefilled).toEqual(prefilled);
        }
    });
});
