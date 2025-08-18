import { renderHook } from '@testing-library/react-hooks';

import { useOnMailTo } from '../containers/ComposeProvider';
import useMailtoHash from './useMailtoHash';

jest.mock('proton-mail/containers/ComposeProvider');

describe('useMailtoHash', () => {
    const originalWindowLocation = window.location;

    const mockReturn = jest.fn();
    const useOnMailToMock = useOnMailTo as jest.Mock;

    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            value: new URL(window.location.href),
        });

        useOnMailToMock.mockReturnValue(mockReturn);
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            value: originalWindowLocation,
        });

        useOnMailToMock.mockClear();
        mockReturn.mockClear();
    });

    it('Should call the onMailTo function with the mailto link', () => {
        const mailto = 'mailto:hello@test.com';
        const newHash = `#mailto=${mailto}`;
        window.location.hash = newHash;

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalled();
        expect(mockReturn).toHaveBeenCalledWith(mailto);
    });

    it('Should not call the onMailTo function when no mailto parameter', () => {
        const mailto = 'mailto:hello@test.com';
        const newHash = `#email=${mailto}`;
        window.location.hash = newHash;

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should not call onMailTo when no hash in location', () => {
        window.location.hash = '';

        renderHook(() => useMailtoHash({ isSearch: true }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should not call onMailTo when search is enabled', () => {
        const mailto = 'mailto:hello@test.com';
        const newHash = `#mailto=${mailto}`;
        window.location.hash = newHash;

        renderHook(() => useMailtoHash({ isSearch: true }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should call onMailTo with decoded URL', () => {
        const mailto = 'mailto%3Ahello%40test.com';
        const decodedMailTo = 'mailto:hello@test.com';
        const newHash = `#mailto=${mailto}`;
        window.location.hash = newHash;

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalled();
        expect(mockReturn).toHaveBeenCalledWith(decodedMailTo);
    });
});
