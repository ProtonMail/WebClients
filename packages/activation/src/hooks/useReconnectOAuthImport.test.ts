import { act, renderHook } from '@testing-library/react';

import { createToken, getTokensByFeature, resumeImport, updateImport } from '../api/api';
import { ApiImportProvider } from '../api/api.interface';
import {
    EASY_SWITCH_FEATURES,
    EASY_SWITCH_SOURCES,
    ImportProvider,
    ImportType,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '../interface';
import type { Importer } from '../logic/importers/importers.interface';
import { useReconnectOAuthImport } from './useReconnectOAuthImport';

const mockApi = jest.fn();
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));

const mockCall = jest.fn();
jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: () => ({ call: mockCall }),
}));

const mockCreateNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const mockTriggerOAuthPopup = jest.fn();
jest.mock('./useOAuthPopup', () => ({
    __esModule: true,
    default: () => ({ triggerOAuthPopup: mockTriggerOAuthPopup, loadingConfig: false }),
}));

const importer: Importer = {
    ID: 'importer-id',
    account: 'jane@gmail.com',
    products: [ImportType.MAIL, ImportType.DRIVE],
    provider: ApiImportProvider.GOOGLE,
};

const existingToken = { ID: 'existing' };
const otherToken = { ID: 'other' };
const newToken = { ID: 'new' };

const mockApiResponses = (tokens: { ID: string }[]) => {
    mockApi.mockImplementation(async ({ url, method }: { url: string; method: string }) => {
        if (url === 'oauth-token/v1/tokens/features') {
            return { Tokens: tokens };
        }
        if (url === 'oauth-token/v1/tokens' && method === 'POST') {
            return { Token: newToken };
        }
        return {};
    });
};

const reconnect = async (source: EASY_SWITCH_SOURCES, product: ImportType) => {
    const { result } = renderHook(() => useReconnectOAuthImport(source));
    await act(() => result.current.reconnectOAuthImport(importer, product));
};

describe('useReconnectOAuthImport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resumes with the existing token without opening the OAuth popup', async () => {
        mockApiResponses([existingToken, otherToken]);

        await reconnect(EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_IMPORT, ImportType.DRIVE);

        expect(mockApi).toHaveBeenCalledWith(
            getTokensByFeature({
                Account: 'jane@gmail.com',
                Features: [EASY_SWITCH_FEATURES.IMPORT_MAIL, EASY_SWITCH_FEATURES.IMPORT_DRIVE],
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );
        expect(mockApi).toHaveBeenCalledWith(updateImport('importer-id', { TokenID: existingToken.ID }));
        expect(mockApi).toHaveBeenCalledWith(
            resumeImport({ ImporterID: 'importer-id', Features: [EASY_SWITCH_FEATURES.IMPORT_DRIVE] })
        );
        expect(mockCall).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Resuming import' });
        expect(mockTriggerOAuthPopup).not.toHaveBeenCalled();
    });

    it.each([EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_IMPORT, EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR])(
        'asks for access again when no token exists, then resumes with the new token (source %s)',
        async (source) => {
            mockApiResponses([]);
            const oAuthProps: OAuthProps = {
                Code: 'oauth-code',
                Provider: OAUTH_PROVIDER.GOOGLE,
                RedirectUri: 'https://example.com/oauth',
            };
            mockTriggerOAuthPopup.mockImplementation(({ callback }) => callback(oAuthProps));

            await reconnect(source, ImportType.MAIL);

            expect(mockTriggerOAuthPopup).toHaveBeenCalledWith(
                expect.objectContaining({
                    provider: ImportProvider.GOOGLE,
                    loginHint: 'jane@gmail.com',
                    features: [EASY_SWITCH_FEATURES.IMPORT_MAIL, EASY_SWITCH_FEATURES.IMPORT_DRIVE],
                })
            );
            expect(mockApi).toHaveBeenCalledWith(
                createToken({
                    ...oAuthProps,
                    Source: source,
                    Features: [EASY_SWITCH_FEATURES.IMPORT_MAIL, EASY_SWITCH_FEATURES.IMPORT_DRIVE],
                })
            );
            expect(mockApi).toHaveBeenCalledWith(updateImport('importer-id', { TokenID: newToken.ID }));
            expect(mockApi).toHaveBeenCalledWith(
                resumeImport({ ImporterID: 'importer-id', Features: [EASY_SWITCH_FEATURES.IMPORT_MAIL] })
            );
            expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Resuming import' });
        }
    );

    it('does not resume when the user closes the OAuth popup', async () => {
        mockApiResponses([]);
        mockTriggerOAuthPopup.mockResolvedValue(undefined);

        await reconnect(EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR, ImportType.DRIVE);

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockCall).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
