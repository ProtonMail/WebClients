import { type ReactNode, type Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import { CircleLoader } from '../CircleLoader/CircleLoader';
import { Scroll } from '../Scroll/Scroll';

import './Panel.scss';

type Props = {
    header?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    className?: string;
    loading?: boolean;
};

const PanelBase = ({ header, footer, children, className, loading }: Props, ref: Ref<HTMLElement>) => {
    return (
        <section ref={ref} className={clsx('panel-section flex flex-column flex-nowrap', className)}>
            {header && <div className="shrink-0 px-4 py-3">{header}</div>}
            <div className="flex-auto h-full overflow-hidden relative">
                {loading && <CircleLoader size="small" className="z-up absolute inset-center" />}
                <Scroll className={clsx('absolute w-full h-full', loading && 'opacity-30 pointer-events-none')}>
                    <div className="px-4 pt-1 pb-3">{children}</div>
                </Scroll>
            </div>
            {footer && <div className="shrink-0 px-4 py-3">{footer}</div>}
        </section>
    );
};

export const Panel = forwardRef(PanelBase);
