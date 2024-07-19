import type { HTMLProps } from 'react';

import clsx from '@proton/utils/clsx';

import { usePublicTheme } from '../containers/PublicThemeProvider';

interface Props extends HTMLProps<HTMLDivElement> {
    center?: boolean;
    disableShadow?: boolean;
    padding?: boolean;
}

const Main = ({ padding = true, children, className, center = true, disableShadow, ...rest }: Props) => {
    const theme = usePublicTheme();

    return (
        <div
            className={clsx(
                'w-full max-w-custom relative sign-layout pt-1 pb-6 sm:p-11',
                theme.card.className,
                padding && 'px-6',
                center && 'mx-auto',
                disableShadow ? '' : 'sm:shadow-lifted shadow-color-primary',
                className
            )}
            style={{ '--max-w-custom': '30rem' }}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Main;
