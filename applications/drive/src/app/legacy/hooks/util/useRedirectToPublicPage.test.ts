import { useLocation } from 'react-router-dom-v5-compat';

import { act, renderHook } from '@testing-library/react';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getSharedLink } from '../../../legacy/store/_shares';
import { when } from '../../../utils/tests/when';
import { getUrlPassword } from '../../../utils/url/password';
import { drivePublicRedirectionReasonKey, useRedirectToPublicPage } from './useRedirectToPublicPage';

const mockHistoryReplace = vi.fn();

vi.mock('react-router-dom-v5-compat', async () => {
    const actual = await vi.importActual('react-router-dom-v5-compat');
    return {
        ...actual,
        useNavigate: vi.fn().mockImplementation(() => mockHistoryReplace),
        useLocation: vi.fn(),
    };
});

const mockedUseLocation = vi.mocked(useLocation);

vi.mock('@proton/shared/lib/helpers/browser');
const mockedReplaceUrl = vi.mocked(replaceUrl);

vi.mock('../../../legacy/store/_shares');
const mockedGetSharedLink = vi.mocked(getSharedLink);

vi.mock('../../../utils/url/password');
const mockedGetUrlPassword = vi.mocked(getUrlPassword);

describe('useRedirectToPublicPage', () => {
    const mockToken = 'mockToken';
    const mockPassword = 'mockPassword';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should redirect if account switch redirection reason is passed and is signin or accountSwitch', () => {
        mockedUseLocation.mockReturnValue({ search: `?${drivePublicRedirectionReasonKey}=signin` } as any);
        const { result } = renderHook(() => useRedirectToPublicPage());
        expect(result.current.redirectionReason).toEqual('signin');

        mockedUseLocation.mockReturnValue({ search: `?${drivePublicRedirectionReasonKey}=accountSwitch` } as any);
        const { result: result2 } = renderHook(() => useRedirectToPublicPage());
        expect(result2.current.redirectionReason).toEqual('accountSwitch');

        mockedUseLocation.mockReturnValue({ search: `?${drivePublicRedirectionReasonKey}=false` } as any);
        const { result: result3 } = renderHook(() => useRedirectToPublicPage());
        expect(result3.current.redirectionReason).toEqual(undefined);
    });

    it('should clean up the URL', () => {
        mockedUseLocation.mockReturnValue({ search: `?${drivePublicRedirectionReasonKey}=signin&token=123` } as any);
        const { result } = renderHook(() => useRedirectToPublicPage());

        result.current.cleanupUrl();

        expect(mockHistoryReplace).toHaveBeenCalledWith(
            {
                search: '',
            },
            { replace: true }
        );
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
