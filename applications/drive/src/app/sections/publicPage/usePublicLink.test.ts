import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { NodeType, getDrive } from '@proton/drive/sdk';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import { setLocation } from '@proton/vitest-config/setLocation';

import { setPublicLinkClient } from './publicLinkClient';
import { usePublicLink } from './usePublicLink';
import { shouldRedirectToPrivateApp } from './utils/shouldRedirectToPrivateApp';

vi.mock('@proton/components/hooks/useAuthentication', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('@proton/drive/sdk', () => ({
    getDrive: vi.fn(),
    NodeType: { File: 'file', Folder: 'folder', Photo: 'photo' },
    DecryptionError: class DecryptionError extends Error {},
    ServerError: class ServerError extends Error {},
    ValidationError: class ValidationError extends Error {},
    splitNodeUid: vi.fn(() => ({ nodeId: 'node-id' })),
}));

vi.mock('@proton/drive/modules/upload', () => ({
    uploadManager: { setDriveClient: vi.fn() },
}));

vi.mock('@proton/metrics/metricsInstance', () => ({
    __esModule: true,
    default: {
        setAuthHeaders: vi.fn(),
        drive_public_share_load_success_total: { increment: vi.fn() },
        drive_public_share_load_error_total: { increment: vi.fn() },
    },
}));

vi.mock('@proton/shared/lib/helpers/mimetype', () => ({
    isNativeProtonDocsAppFile: vi.fn(() => false),
}));

vi.mock('../../modules/download/DownloadManager', () => ({
    downloadManager: { setDriveClient: vi.fn() },
}));

vi.mock('../../legacy/store/_user/getMetricsUserPlan', () => ({
    getMetricsUserPlan: vi.fn(() => 'anonymous'),
}));

vi.mock('../../utils/docs/openInDocs', () => ({
    getOpenInDocsInfo: vi.fn(),
    openDocsOrSheetsDocument: vi.fn(),
    openPublicDocsOrSheetsDocument: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling', () => ({
    sendErrorReport: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling', () => ({
    is4xx: vi.fn(),
    is5xx: vi.fn(),
}));

vi.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({
    getNodeEntity: vi.fn(),
}));

vi.mock('../../utils/telemetry', () => ({
    Actions: { PublicLinkVisit: 'PublicLinkVisit' },
    countActionWithTelemetry: vi.fn(),
}));

vi.mock('./publicLinkClient', () => ({
    setPublicLinkClient: vi.fn(),
}));

vi.mock('./usePublicAuth.store', () => ({
    usePublicAuthStore: { getState: vi.fn(() => ({ setPublicRole: vi.fn() })) },
}));

vi.mock('./utils/getPublicTokenAndPassword', () => ({
    getPublicTokenAndPassword: vi.fn(() => ({ token: 'test-token', urlPassword: '' })),
}));

vi.mock('./utils/shouldRedirectToPrivateApp', () => ({
    shouldRedirectToPrivateApp: vi.fn(() => false),
}));

describe('usePublicLink', () => {
    const mockGetURLAccessInfo = vi.fn();
    const mockAuthURLAccess = vi.fn();
    const mockGetRootNode = vi.fn();
    const mockGetSessionInfo = vi.fn(() => ({ accessToken: 'token', uid: 'uid' }));

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
        vi.clearAllMocks();

        vi.mocked(useAuthentication).mockReturnValue({ getUID: () => undefined } as any);
        vi.mocked(useNotifications).mockReturnValue({ createNotification: vi.fn() } as any);
        vi.mocked(getNodeEntity).mockReturnValue({ node: fakeNode } as any);
        vi.mocked(shouldRedirectToPrivateApp).mockReturnValue(false);
        vi.mocked(isNativeProtonDocsAppFile).mockReturnValue(false);

        mockGetURLAccessInfo.mockResolvedValue({
            isCustomPasswordProtected: false,
            isLegacy: false,
            vendorType: 0,
        });
        mockAuthURLAccess.mockResolvedValue({
            experimental: { getSessionInfo: mockGetSessionInfo },
            getRootNode: mockGetRootNode,
        });
        mockGetRootNode.mockResolvedValue(fakeNode);

        vi.mocked(getDrive).mockReturnValue({
            experimental: {
                getURLAccessInfo: mockGetURLAccessInfo,
                authURLAccess: mockAuthURLAccess,
            },
        } as any);
    });

    it('with hash: loads the root node using the real URL', async () => {
        const href = 'https://drive.proton.dev/urls/Z4G9B587S0#M4oaMipDImzI';
        setLocation(href);

        const { result } = renderHook(() => usePublicLink());

        await act(async () => {
            await result.current.loadPublicLink();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetURLAccessInfo).toHaveBeenCalledWith(href);
        expect(mockAuthURLAccess).toHaveBeenCalledWith(href, '', true);
        expect(setPublicLinkClient).toHaveBeenCalled();
        expect(result.current.rootNode).toBe(fakeNode);
        expect(result.current.isPasswordNeeded).toBe(false);
    });

    it('without hash: prompts for the URL password without calling the SDK', async () => {
        setLocation('https://drive.proton.dev/urls/Z4G9B587S0');

        const { result } = renderHook(() => usePublicLink());

        await act(async () => {
            await result.current.loadPublicLink();
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockGetURLAccessInfo).not.toHaveBeenCalled();
        expect(mockAuthURLAccess).not.toHaveBeenCalled();
        expect(result.current.isPasswordNeeded).toBe(true);
        expect(result.current.rootNode).toBeUndefined();
    });

    it('without hash + submitted password: builds a synthetic URL with the password and loads the node', async () => {
        const href = 'https://drive.proton.dev/urls/Z4G9B587S0';
        setLocation(href);

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
        expect(mockGetURLAccessInfo).toHaveBeenCalledWith(expectedSdkUrl);
        expect(mockAuthURLAccess).toHaveBeenCalledWith(expectedSdkUrl, undefined, true);
        expect(window.location.hash).toBe('');
        expect(result.current.rootNode).toBe(fakeNode);
    });
});
