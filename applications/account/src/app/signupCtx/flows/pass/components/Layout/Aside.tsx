import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import background190 from '../../assets/images/aside_background/aside_background_w_190.webp';
import background619 from '../../assets/images/aside_background/aside_background_w_619.webp';
import background864 from '../../assets/images/aside_background/aside_background_w_864.webp';
import background961 from '../../assets/images/aside_background/aside_background_w_961.webp';
import background1000 from '../../assets/images/aside_background/aside_background_w_1000.webp';

type AsideProps = { className?: string };

export const Aside: FC<PropsWithChildren<AsideProps>> = ({ children, className }) => (
    <aside className={clsx('flex justify-center h-screen w-1/2', className)}>
        <div
            className="w-full flex flex-column justify-center items-center m-2 relative rounded-lg"
            style={{ backgroundColor: '#896daf' }}
        >
            <img
                className="absolute inset-0 h-full w-full z-0 object-cover rounded-lg"
                sizes="(max-width: 1000px) 100vw, 1000px"
                srcSet={`${background190} 190w,${background619} 619w,${background864} 864w,${background961} 961w,${background1000} 1000w`}
                src={background1000}
                alt=""
            />
            {children}
        </div>
    </aside>
);
