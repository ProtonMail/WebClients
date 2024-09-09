import React, { useEffect, useRef } from 'react';

import { useFloatingEllipsisEventBasedUpdater } from './hooks';

const FloatingEllipsis = ({ visibilityControlRef }: { visibilityControlRef: React.RefObject<HTMLDivElement> }) => {
    const elem = useRef<HTMLDivElement>(null);

    const updateVisibility = useFloatingEllipsisEventBasedUpdater({
        visibilityControlRef,
        elem,
    });
    useEffect(() => {
        updateVisibility();
    }, []);

    return <div className="floating-ellipsis floating-ellipsis-hidden" ref={elem}></div>;
};

export default FloatingEllipsis;
