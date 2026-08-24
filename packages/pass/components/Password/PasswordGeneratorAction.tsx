import type { PropsWithChildren } from 'react';
import { type FC, createContext } from 'react';

import type { UseAsyncModalHandle } from '../../hooks/useAsyncModalHandles';
import { useAsyncModalHandles } from '../../hooks/useAsyncModalHandles';
import { createUseContext } from '../../hooks/useContextFactory';
import type { MaybeNull } from '../../types';
import type { PasswordGeneratorModalState } from './PasswordGeneratorModal';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

type PasswordGeneratorActionsContextValue = UseAsyncModalHandle<string, PasswordGeneratorModalState>;
const PasswordGeneratorContext = createContext<MaybeNull<PasswordGeneratorActionsContextValue>>(null);

const getInitialModalState = (): PasswordGeneratorModalState => ({ actionLabel: '' });

export const PasswordGeneratorAction: FC<PropsWithChildren> = ({ children }) => {
    const { handler, abort, resolver, state } = useAsyncModalHandles<string, PasswordGeneratorModalState>({
        getInitialModalState,
    });

    return (
        <PasswordGeneratorContext.Provider value={handler}>
            {children}
            {state.open && <PasswordGeneratorModal onClose={abort} onSubmit={resolver} {...state} />}
        </PasswordGeneratorContext.Provider>
    );
};

export const usePasswordGeneratorAction = createUseContext(PasswordGeneratorContext);
