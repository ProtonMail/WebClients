import type { VFC } from 'react';
import { useEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';

type Props = { children: string; className?: string };

export const TextAreaReadonly: VFC<Props> = ({ children, className }) => {
    const [height, setHeight] = useState(0);
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current) setHeight(ref.current.scrollHeight);
    }, [children]);

    return (
        <textarea
            ref={ref}
            readOnly
            value={children}
            className={clsx('w100 h100 text-pre-wrap overflow-hidden resize-none h-custom', className)}
            style={{ '--h-custom': `${height}px` }}
        />
    );
};
