import type { FC } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';

type Props = { children: string; className?: string };

export const TextAreaReadonly: FC<Props> = ({ children, className }) => {
    const [height, setHeight] = useState(0);
    const ref = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (ref.current) setHeight(ref.current.scrollHeight);
    }, [children]);

    return (
        <textarea
            ref={ref}
            readOnly
            value={children}
            className={clsx('w-full h-full text-pre-wrap resize-none h-custom', className)}
            style={{ '--h-custom': `${height}px`, opacity: 1 }}
        />
    );
};
