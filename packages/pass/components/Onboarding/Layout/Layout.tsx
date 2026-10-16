import type { FC, PropsWithChildren, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { Aside } from './Aside';
import { Header } from './Header';
import { Main } from './Main';
import { Wrapper } from './Wrapper';

import './Onboarding.scss';

export type ContentLayout = 'centered' | 'fill';

export type LayoutProps = {
    aside?: ReactNode;
    className?: string;
    contentLayout?: ContentLayout;
    footer?: ReactNode;
};

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
    children,
    aside,
    className,
    contentLayout = 'centered',
    footer,
}) => (
    <div className={clsx('pass-onboarding ui-prominent min-h-full w-full flex flex-row', className)}>
        <div
            className={clsx(
                `min-h-full w-full flex flex-column flex-nowrap justify-start overflow-auto relative`,
                !!aside && 'lg:w-1/2'
            )}
        >
            <Header />
            <Wrapper contentLayout={contentLayout}>
                <Main fullWidth={!aside} contentLayout={contentLayout}>
                    {children}
                </Main>
            </Wrapper>
            {footer ?? null}
        </div>

        {aside && <Aside className="hidden lg:flex">{aside}</Aside>}
    </div>
);
