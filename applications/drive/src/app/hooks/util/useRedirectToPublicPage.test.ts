import { useHistory, useLocation } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react-hooks';
import { when } from 'jest-when';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getSharedLink } from '../../store/_shares';
import { getUrlPassword } from '../../utils/url/password';
import { useRedirectToPublicPage } from './useRedirectToPublicPage';

jest.mock('react-router-dom', () => ({
    useHistory: jest.fn(),
    useLocation: jest.fn(),
}));
const mockedUseHistory = jest.mocked(useHistory);
const mockedUseLocation = jest.mocked(useLocation);

jest.mock('@proton/shared/lib/helpers/browser');
const mockedReplaceUrl = jest.mocked(replaceUrl);

jest.mock('../../store/_shares');
const mockedGetSharedLink = jest.mocked(getSharedLink);

jest.mock('../../utils/url/password');
const mockedGetUrlPassword = jest.mocked(getUrlPassword);

describe('useRedirectToPublicPage', () => {
    const mockHistoryReplace = jest.fn();
    const mockToken = 'mockToken';
    const mockPassword = 'mockPassword';

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseHistory.mockReturnValue({ replace: mockHistoryReplace } as any);
    });

    it('should determine if redirection is needed', () => {
        mockedUseLocation.mockReturnValue({ search: '?redirectToPublic=true' } as any);
        const { result } = renderHook(() => useRedirectToPublicPage());
        expect(result.current.needToRedirectToPublicPage).toBe(true);

        mockedUseLocation.mockReturnValue({ search: '?redirectToPublic=false' } as any);
        const { result: result2 } = renderHook(() => useRedirectToPublicPage());
        expect(result2.current.needToRedirectToPublicPage).toBe(false);
    });

    it('should clean up the URL', () => {
        mockedUseLocation.mockReturnValue({ search: '?redirectToPublic=true&token=123' } as any);
        const { result } = renderHook(() => useRedirectToPublicPage());

        result.current.cleanupUrl();

        expect(mockHistoryReplace).toHaveBeenCalledWith({ search: '' });
    });

    it('should not redirect if urlPassword is empty', () => {
        when(mockedGetUrlPassword).calledWith({ readOnly: true }).mockReturnValueOnce('');
        const { result } = renderHook(() => useRedirectToPublicPage());

        result.current.redirectToPublicPage(mockToken);

        expect(mockedGetSharedLink).not.toHaveBeenCalled();
        expect(mockedReplaceUrl).not.toHaveBeenCalled();
    });

    it('should not redirect if getSharedLink returns undefined', () => {
        when(mockedGetUrlPassword).calledWith({ readOnly: true }).mockReturnValueOnce(mockPassword);
        when(mockedGetSharedLink).calledWith({ token: mockToken, password: mockPassword }).mockReturnValue(undefined);

        const { result } = renderHook(() => useRedirectToPublicPage());

        act(() => {
            result.current.redirectToPublicPage(mockToken);
        });

        expect(mockedReplaceUrl).not.toHaveBeenCalled();
    });

    it('should redirect if both urlPassword and sharedLink are truthy', () => {
        const mockSharedLink = `https://drive.proton.me/urls/${mockToken}#${mockPassword}`;
        when(mockedGetUrlPassword).calledWith({ readOnly: true, filterCustom: true }).mockReturnValueOnce(mockPassword);
        when(mockedGetSharedLink)
            .calledWith({ token: mockToken, password: mockPassword })
            .mockReturnValue(mockSharedLink);

        const { result } = renderHook(() => useRedirectToPublicPage());

        act(() => {
            result.current.redirectToPublicPage(mockToken);
        });

        expect(mockedReplaceUrl).toHaveBeenCalledWith(mockSharedLink);
    });
});
