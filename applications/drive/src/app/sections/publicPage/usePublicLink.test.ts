import { act, renderHook, waitFor } from '@testing-library/react';

import { useAuthentication, useNotifications } from '@proton/components';
import { NodeType, getDrive } from '@proton/drive';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { setPublicLinkClient } from './publicLinkClient';
import { usePublicLink } from './usePublicLink';
import { shouldRedirectToPrivateApp } from './utils/shouldRedirectToPrivateApp';

jest.mock('@proton/components', () => ({
    useAuthentication: jest.fn(),
    useNotifications: jest.fn(),
}));

jest.mock('@proton/drive', () => ({
    getDrive: jest.fn(),
    NodeType: { File: 'file', Folder: 'folder', Photo: 'photo' },
    DecryptionError: class DecryptionError extends Error {},
    ServerError: class ServerError extends Error {},
    ValidationError: class ValidationError extends Error {},
    splitNodeUid: jest.fn(() => ({ nodeId: 'node-id' })),
}));

jest.mock('@proton/drive/modules/upload', () => ({
    uploadManager: { setDriveClient: jest.fn() },
}));

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        setAuthHeaders: jest.fn(),
        drive_public_share_load_success_total: { increment: jest.fn() },
        drive_public_share_load_error_total: { increment: jest.fn() },
    },
}));

jest.mock('@proton/shared/lib/helpers/mimetype', () => ({
    isNativeProtonDocsAppFile: jest.fn(() => false),
}));

jest.mock('../../managers/download/DownloadManager', () => ({
    downloadManager: { setDriveClient: jest.fn() },
}));

jest.mock('../../store/_user/getMetricsUserPlan', () => ({
    getMetricsUserPlan: jest.fn(() => 'anonymous'),
}));

jest.mock('../../utils/docs/openInDocs', () => ({
    getOpenInDocsInfo: jest.fn(),
    openDocsOrSheetsDocument: jest.fn(),
    openPublicDocsOrSheetsDocument: jest.fn(),
}));

jest.mock('../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

jest.mock('../../utils/errorHandling/apiErrors', () => ({
    is4xx: jest.fn(),
    is5xx: jest.fn(),
}));

jest.mock('../../utils/sdk/getNodeEntity', () => ({
    getNodeEntity: jest.fn(),
}));

jest.mock('../../utils/telemetry', () => ({
    Actions: { PublicLinkVisit: 'PublicLinkVisit' },
    countActionWithTelemetry: jest.fn(),
}));

jest.mock('./publicLinkClient', () => ({
    setPublicLinkClient: jest.fn(),
}));

jest.mock('./usePublicAuth.store', () => ({
    usePublicAuthStore: { getState: jest.fn(() => ({ setPublicRole: jest.fn() })) },
}));

jest.mock('./utils/getPublicTokenAndPassword', () => ({
    getPublicTokenAndPassword: jest.fn(() => ({ token: 'test-token', urlPassword: '' })),
}));

jest.mock('./utils/shouldRedirectToPrivateApp', () => ({
    shouldRedirectToPrivateApp: jest.fn(() => false),
}));

const setLocation = (href: string, hash = '') => {
    const url = new URL(href);
    Object.defineProperty(window, 'location', {
        value: {
            href,
            origin: url.origin,
            pathname: url.pathname,
            search: url.search,
            hash,
        },
        writable: true,
    });
};

describe('usePublicLink', () => {
    const mockGetPublicLinkInfo = jest.fn();
    const mockAuthPublicLink = jest.fn();
    const mockGetRootNode = jest.fn();
    const mockGetSessionInfo = jest.fn(() => ({ accessToken: 'token', uid: 'uid' }));

    const fakeNode = {
        uid: 'volume~node',
        type: NodeType.File,
        mediaType: 'text/plain',
        directRole: 'viewer',
        deprecatedShareId: undefined,
        keyAuthor: { ok: true, value: 'author' },
        name: 'file.txt',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jest.mocked(useAuthentication).mockReturnValue({ getUID: () => undefined } as any);
        jest.mocked(useNotifications).mockReturnValue({ createNotification: jest.fn() } as any);
        jest.mocked(getNodeEntity).mockReturnValue({ node: fakeNode } as any);
        jest.mocked(shouldRedirectToPrivateApp).mockReturnValue(false);
        jest.mocked(isNativeProtonDocsAppFile).mockReturnValue(false);

        mockGetPublicLinkInfo.mockResolvedValue({
            isCustomPasswordProtected: false,
            isLegacy: false,
            vendorType: 0,
        });
        mockAuthPublicLink.mockResolvedValue({
            experimental: { getSessionInfo: mockGetSessionInfo },
            getRootNode: mockGetRootNode,
        });
        mockGetRootNode.mockResolvedValue(fakeNode);

        jest.mocked(getDrive).mockReturnValue({
            experimental: {
                getPublicLinkInfo: mockGetPublicLinkInfo,
                authPublicLink: mockAuthPublicLink,
            },
        } as any);
    });

    it('with hash: loads the root node using the real URL', async () => {
        const href = 'https://drive.proton.dev/urls/Z4G9B587S0';
        setLocation(href, '#M4oaMipDImzI');

        const { result } = renderHook(() => usePublicLink());

        await act(async () => {
            await result.current.loadPublicLink();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetPublicLinkInfo).toHaveBeenCalledWith(href);
        expect(mockAuthPublicLink).toHaveBeenCalledWith(href, '', true);
        expect(setPublicLinkClient).toHaveBeenCalled();
        expect(result.current.rootNode).toBe(fakeNode);
        expect(result.current.isPasswordNeeded).toBe(false);
    });

    it('without hash: prompts for the URL password without calling the SDK', async () => {
        setLocation('https://drive.proton.dev/urls/Z4G9B587S0', '');

        const { result } = renderHook(() => usePublicLink());

        await act(async () => {
            await result.current.loadPublicLink();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetPublicLinkInfo).not.toHaveBeenCalled();
        expect(mockAuthPublicLink).not.toHaveBeenCalled();
        expect(result.current.isPasswordNeeded).toBe(true);
        expect(result.current.rootNode).toBeUndefined();
    });

    it('without hash + submitted password: builds a synthetic URL with the password and loads the node', async () => {
        const href = 'https://drive.proton.dev/urls/Z4G9B587S0';
        setLocation(href, '');

        const { result } = renderHook(() => usePublicLink());

        await act(async () => {
            await result.current.loadPublicLink();
        });
        expect(result.current.isPasswordNeeded).toBe(true);

        await act(async () => {
            await result.current.loadPublicLink('477cjB41Q8UK');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const expectedSdkUrl = `${href}#477cjB41Q8UK`;
        expect(mockGetPublicLinkInfo).toHaveBeenCalledWith(expectedSdkUrl);
        expect(mockAuthPublicLink).toHaveBeenCalledWith(expectedSdkUrl, undefined, true);
        expect(window.location.hash).toBe('');
        expect(result.current.rootNode).toBe(fakeNode);
    });
});
