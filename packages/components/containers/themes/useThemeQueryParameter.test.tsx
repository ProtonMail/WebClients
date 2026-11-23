import { renderHook } from '@testing-library/react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';

import { useTheme } from './ThemeProvider';
import useThemeQueryParameter from './useThemeQueryParameter';

vi.mock('./ThemeProvider');

describe('useThemeQueryParameter', () => {
    const setTheme = vi.fn();

    const setSearch = (search: string) => {
        window.history.replaceState(null, '', `/${search}`);
    };

    beforeEach(() => {
        setTheme.mockClear();
        vi.mocked(useTheme).mockReturnValue({ setTheme } as unknown as ReturnType<typeof useTheme>);
        setSearch('');
    });

    afterAll(() => {
        setSearch('');
    });

    it('applies and returns the theme from the URL on mount', () => {
        setSearch(`?theme=${ThemeTypes.Carbon}`);
        const { result } = renderHook(() => useThemeQueryParameter());

        expect(setTheme).toHaveBeenCalledTimes(1);
        expect(setTheme).toHaveBeenCalledWith(ThemeTypes.Carbon);
        expect(result.current).toBe(ThemeTypes.Carbon);
    });

    it('applies and returns the default theme on mount when there is no theme parameter', () => {
        const { result } = renderHook(() => useThemeQueryParameter());

        expect(setTheme).toHaveBeenCalledTimes(1);
        expect(setTheme).toHaveBeenCalledWith(PROTON_DEFAULT_THEME);
        expect(result.current).toBe(PROTON_DEFAULT_THEME);
    });

    it('applies and returns the default theme on mount when the theme parameter is invalid', () => {
        setSearch('?theme=999');
        const { result } = renderHook(() => useThemeQueryParameter());

        expect(setTheme).toHaveBeenCalledTimes(1);
        expect(setTheme).toHaveBeenCalledWith(PROTON_DEFAULT_THEME);
        expect(result.current).toBe(PROTON_DEFAULT_THEME);
    });

    it('keeps the applied theme when the URL later drops the theme parameter', () => {
        setSearch(`?theme=${ThemeTypes.Carbon}`);
        const { result, rerender } = renderHook(() => useThemeQueryParameter());
        setTheme.mockClear();

        setSearch('');
        rerender();

        expect(setTheme).not.toHaveBeenCalled();
        expect(result.current).toBe(ThemeTypes.Carbon);
    });

    it('applies a different valid theme from a later URL', () => {
        setSearch(`?theme=${ThemeTypes.Carbon}`);
        const { result, rerender } = renderHook(() => useThemeQueryParameter());
        setTheme.mockClear();

        setSearch(`?theme=${ThemeTypes.Snow}`);
        rerender();

        expect(setTheme).toHaveBeenCalledTimes(1);
        expect(setTheme).toHaveBeenCalledWith(ThemeTypes.Snow);
        expect(result.current).toBe(ThemeTypes.Snow);
    });
});
