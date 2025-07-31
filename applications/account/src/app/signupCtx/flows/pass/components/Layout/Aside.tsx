import type { FC, PropsWithChildren } from 'react';

import background from '../../assets/images/aside_background.webp';

type AsideProps = { className?: string };

export const Aside: FC<PropsWithChildren<AsideProps>> = ({ children, className }) => (
    <aside className={`flex justify-center h-screen w-1/2 ${className}`}>
        <div
            className="w-full flex flex-column justify-center items-center rounded-lg m-2"
            style={{ background: `url(${background}) lightgray 50% / cover no-repeat` }}
        >
            {children}
        </div>
    </aside>
);
