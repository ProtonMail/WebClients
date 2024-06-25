import React, { ReactNode } from 'react';

import { ResponsiveContainerContext } from '.';

export const ResponsiveContainerContextProvider = ({
    isNarrow = false,
    children,
}: {
    isNarrow: boolean;
    children: ReactNode;
}) => {
    return <ResponsiveContainerContext.Provider value={{ isNarrow }}>{children}</ResponsiveContainerContext.Provider>;
};
