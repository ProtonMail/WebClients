import type { FC, PropsWithChildren, RefObject } from 'react';
import { createContext, memo, useEffect, useMemo, useRef, useState } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './InAppNotificationPortal.scss';

type InAppNotificationPortalContextValue = {
    container: MaybeNull<RefObject<HTMLDivElement>>;
    setContainer: (next: MaybeNull<RefObject<HTMLDivElement>>) => void;
};

const InAppNotificationPortalContext = createContext<MaybeNull<InAppNotificationPortalContextValue>>(null);
export const useInAppNotificationContainer = createUseContext(InAppNotificationPortalContext);

export const InAppNotificationProvider: FC<PropsWithChildren> = ({ children }) => {
    const [container, setContainer] = useState<MaybeNull<RefObject<HTMLDivElement>>>(null);

    return (
        <InAppNotificationPortalContext.Provider value={useMemo(() => ({ container, setContainer }), [container])}>
            {children}
        </InAppNotificationPortalContext.Provider>
    );
};

export const InAppNotificationContainer = memo(({ className }: { className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { setContainer } = useInAppNotificationContainer();

    useEffect(() => {
        setContainer(ref);
        return () => setContainer(null);
    }, []);

    return <div className={clsx('pass-notification--portal', className)} ref={ref} />;
});

InAppNotificationContainer.displayName = 'InAppNotificationContainerMemo';
