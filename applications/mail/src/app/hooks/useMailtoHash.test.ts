import { useLocation } from 'react-router';

import { renderHook } from '@testing-library/react-hooks';

import { useOnMailTo } from '../containers/ComposeProvider';
import useMailtoHash from './useMailtoHash';

jest.mock('react-router');
jest.mock('proton-mail/containers/ComposeProvider');

describe('useMailtoHash', () => {
    const mockReturn = jest.fn();
    const useOnMailToMock = useOnMailTo as jest.Mock;

    const mockHash = (hash: string) => {
        jest.mocked(useLocation).mockReturnValue({ hash } as any);
    };

    beforeEach(() => {
        mockHash('');
        useOnMailToMock.mockReturnValue(mockReturn);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should call the onMailTo function with the mailto link', () => {
        const mailto = 'mailto:hello@test.com';
        mockHash(`#mailto=${mailto}`);

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith(mailto);
    });

    it('Should call the onMailTo function when the mailto is preceded by a category', () => {
        const mailto = 'mailto:hello@test.com';
        mockHash(`#category=primary&mailto=${mailto}`);

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith(mailto);
    });

    it('Should drop the mailbox params following the mailto', () => {
        mockHash('#mailto=mailto:hello@test.com&category=primary');

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith('mailto:hello@test.com');
    });

    it('Should keep the mailto params and drop the mailbox ones, whatever their order', () => {
        mockHash('#mailto=mailto:hello@test.com?subject=Hi&category=primary&cc=cc@test.com&page=2&body=Bye');

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith('mailto:hello@test.com?subject=Hi&cc=cc%40test.com&body=Bye');
    });

    it('Should open the query with a ? when the hash separates the mailto params with a &', () => {
        mockHash('#mailto=mailto:hello@test.com&subject=test&body=xxx&category=primary');

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith('mailto:hello@test.com?subject=test&body=xxx');
    });

    it('Should keep the mailto params encoded by the protocol handler and drop the mailbox ones', () => {
        mockHash('#mailto=mailto%3Ahello%40test.com%3Fsubject%3DHi%26body%3DBye&category=primary');

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith('mailto:hello@test.com?subject=Hi&body=Bye');
    });

    it('Should not treat a + in the address as a space', () => {
        mockHash('#mailto=mailto:hello+tag@test.com&category=primary');

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith('mailto:hello+tag@test.com');
    });

    it('Should not call the onMailTo function when no mailto parameter', () => {
        const mailto = 'mailto:hello@test.com';
        mockHash(`#email=${mailto}`);

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should not call onMailTo when no hash in location', () => {
        mockHash('');

        renderHook(() => useMailtoHash({ isSearch: true }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should not call onMailTo when search is enabled', () => {
        const mailto = 'mailto:hello@test.com';
        mockHash(`#mailto=${mailto}`);

        renderHook(() => useMailtoHash({ isSearch: true }));
        expect(mockReturn).not.toHaveBeenCalled();
    });

    it('Should not reopen the composer when a redirect rewrites the hash but keeps the same mailto', () => {
        const mailto = 'mailto:hello@test.com';
        mockHash(`#mailto=${mailto}`);

        const { rerender } = renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledTimes(1);

        // Simulate the category redirect appending a category to the hash while keeping the mailto
        mockHash(`#category=primary&mailto=${mailto}`);
        rerender();

        expect(mockReturn).toHaveBeenCalledTimes(1);
    });

    it('Should reopen the composer when the hash carries a different mailto', () => {
        mockHash('#mailto=mailto:hello@test.com');

        const { rerender } = renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledTimes(1);

        mockHash('#mailto=mailto:other@test.com');
        rerender();

        expect(mockReturn).toHaveBeenCalledTimes(2);
        expect(mockReturn).toHaveBeenLastCalledWith('mailto:other@test.com');
    });

    it('Should call onMailTo with decoded URL', () => {
        const mailto = 'mailto%3Ahello%40test.com';
        const decodedMailTo = 'mailto:hello@test.com';
        mockHash(`#mailto=${mailto}`);

        renderHook(() => useMailtoHash({ isSearch: false }));
        expect(mockReturn).toHaveBeenCalledWith(decodedMailTo);
    });
});
