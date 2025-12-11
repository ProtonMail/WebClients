import type { FC, MouseEvent, PropsWithChildren } from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

type ContextMenuState = { id: string; position: { top: number; left: number } };

interface ClientContextValue {
    state: MaybeNull<ContextMenuState>;
    close: () => void;
    open: (e: MouseEvent, id: string) => void;
}

const ContextMenuContext = createContext<MaybeNull<ClientContextValue>>(null);
export const useContextMenu = createUseContext(ContextMenuContext);

export const ContextMenuProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<MaybeNull<ContextMenuState>>(null);
    const enabled = useStatefulRef(useFeatureFlag(PassFeature.PassContextMenu));

    const open = useCallback((event: MouseEvent, id: string) => {
        event.stopPropagation();
        event.preventDefault();
        if (!enabled.current) return;
        document.dispatchEvent(new CustomEvent('dropdownclose'));
        setState({ id, position: { top: event.clientY, left: event.clientX } });
    }, []);

    const close = useCallback(() => setState(null), []);

    return (
        <ContextMenuContext.Provider value={useMemo(() => ({ open, close, state }), [state])}>
            {children}
        </ContextMenuContext.Provider>
    );
};
