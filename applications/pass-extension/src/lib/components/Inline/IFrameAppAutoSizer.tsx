import type { CSSProperties, FC, PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { useIFrameAppController, useIFrameAppState } from './IFrameApp';

type Props = {
    className?: string;
    style?: CSSProperties;
};

export const IFrameAppAutoSizer: FC<PropsWithChildren<Props>> = ({ className, style, children }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && visible) {
            const obs = new ResizeObserver(([entry]) => controller.resize(entry.contentRect.height));
            obs.observe(ref.current);
            controller.resize(ref.current.getBoundingClientRect().height);
            return () => obs.disconnect();
        }
    }, [visible]);

    return (
        <div ref={ref} className={className} style={style}>
            {children}
        </div>
    );
};
