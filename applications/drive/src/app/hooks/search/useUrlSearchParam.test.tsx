import { MemoryRouter } from 'react-router-dom-v5-compat';

import { act, renderHook } from '@testing-library/react-hooks';

import { useUrlSearchParams } from './useUrlSearchParam';

const createWrapper = (initialEntries: string[]) => {
    const Wrapper = ({ children }: { children: JSX.Element }) => (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
    return Wrapper;
};

describe('useUrlSearchParams', () => {
    it('should return empty string when there is no hash', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/']),
        });

        expect(result.current[0]).toBe('');
    });

    it('should extract q param from hash', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/#q=hello']),
        });

        expect(result.current[0]).toBe('hello');
    });

    it('should decode URI-encoded q param', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/#q=hello%20world']),
        });

        expect(result.current[0]).toBe('hello world');
    });

    it('should return empty string when hash has no q param', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/#other=value']),
        });

        expect(result.current[0]).toBe('');
    });

    it('should extract q param when multiple hash params exist', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/#foo=bar&q=search%20term&baz=qux']),
        });

        expect(result.current[0]).toBe('search term');
    });

    it('should allow updating the value via setter', () => {
        const { result } = renderHook(() => useUrlSearchParams(), {
            wrapper: createWrapper(['/#q=initial']),
        });

        expect(result.current[0]).toBe('initial');

        act(() => {
            result.current[1]('updated');
        });

        expect(result.current[0]).toBe('updated');
    });
});
