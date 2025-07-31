import type { FC, PropsWithChildren, ReactNode } from 'react';

import { Aside } from './Aside';
import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';
import { Wrapper } from './Wrapper';

import './layout.scss';

type LayoutProps = { aside?: ReactNode };

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ children, aside }) => (
    <div className="min-h-screen w-screen h-screen flex flex-column lg:flex-row signup-bg-gradient">
        <div
            className={`flex flex-column flex-nowrap h-full overflow-auto relative signup w-full ${aside && 'lg:w-1/2'}`}
        >
            <Header />
            <Wrapper minHeight="calc(100vh - 4.25rem - 3.85rem)">
                <Main fullWidth={!aside}>{children}</Main>
            </Wrapper>
            <Footer />
        </div>

        {aside && <Aside className="hidden lg:flex">{aside}</Aside>}
    </div>
);
