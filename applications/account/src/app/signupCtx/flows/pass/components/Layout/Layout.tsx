import type { FC, PropsWithChildren, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { Aside } from './Aside';
import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';
import { Wrapper } from './Wrapper';

import './layout.scss';

type LayoutProps = { aside?: ReactNode };

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ children, aside }) => (
    <div className="min-h-full w-full flex flex-row signup-bg-gradient">
        <div
            className={clsx(
                `min-h-full w-full flex flex-column flex-nowrap justify-space-between overflow-auto relative signup`,
                !!aside && 'lg:w-1/2'
            )}
        >
            <Header />
            <Wrapper>
                <Main fullWidth={!aside}>{children}</Main>
            </Wrapper>
            <Footer />
        </div>

        {aside && <Aside className="hidden lg:flex">{aside}</Aside>}
    </div>
);
