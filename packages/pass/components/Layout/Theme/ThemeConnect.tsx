import type { FC, PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { selectTheme } from '@proton/pass/store/selectors';

export const ThemeConnect: FC<PropsWithChildren> = ({ children }) => {
    const selectedTheme = useSelector(selectTheme);
    return <ThemeProvider theme={selectedTheme}>{children}</ThemeProvider>;
};
