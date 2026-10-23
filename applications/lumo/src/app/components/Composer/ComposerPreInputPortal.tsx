import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface ComposerPreInputPortalContextValue {
    root: HTMLDivElement | null;
    setRoot: (element: HTMLDivElement | null) => void;
}

const ComposerPreInputPortalContext = createContext<ComposerPreInputPortalContextValue | null>(null);

/** Share the composer's mount target with content rendered elsewhere in the conversation. */
export const ComposerPreInputPortalProvider = ({ children }: { children: ReactNode }) => {
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const value = useMemo(() => ({ root, setRoot }), [root]);

    return <ComposerPreInputPortalContext.Provider value={value}>{children}</ComposerPreInputPortalContext.Provider>;
};

/** Register the target on mount and clear it on unmount, regardless of which component mounts first. */
export const ComposerPreInputPortalRoot = () => {
    const context = useContext(ComposerPreInputPortalContext);

    return <div className="w-full mb-2 empty:hidden" ref={context?.setRoot} />;
};

/** Render children above the composer once its root is available. */
export const ComposerPreInputPortal = ({ children }: { children: ReactNode }) => {
    const context = useContext(ComposerPreInputPortalContext);

    return context?.root ? createPortal(children, context.root) : null;
};
