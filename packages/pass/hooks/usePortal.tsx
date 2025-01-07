import type { ReactNode, ReactPortal } from 'react';
import { type ReactElement, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { MaybeNull } from '@proton/pass/types';

type UsePortalType = {
    ParentPortal: ReactElement;
    openPortal: (children: ReactNode) => MaybeNull<ReactPortal>;
};

export const usePortal = (): UsePortalType => {
    const ref = useRef<HTMLDivElement>(null);

    return {
        ParentPortal: useMemo(() => <div ref={ref} />, []),
        openPortal: (children) => (ref.current ? createPortal(children, ref.current) : null),
    };
};
