import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { createContext, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { PASS_POPULAR_SERVICES_URL } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { selectDefaultVault, selectUser } from '@proton/pass/store/selectors';
import type { ItemCreateIntent, MaybeNull } from '@proton/pass/types';
import { AutofillMode } from '@proton/pass/types/protobuf';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import noop from '@proton/utils/noop';

export type RemoteService = { title: string; urls: string[] };

type CreateContextValue = {
    services: RemoteService[];
    service: MaybeNull<RemoteService>;
    password: string;
};

type CreateContextActions = {
    fetchServices: () => Promise<void>;
    setState: Dispatch<SetStateAction<CreateContextValue>>;
    createLogin: () => MaybeNull<ItemCreateIntent<'login'>>;
};

const defaultValue: CreateContextValue = { services: [], service: null, password: '' };
const defaultActions: CreateContextActions = { fetchServices: async () => {}, setState: noop, createLogin: () => null };

const CreateContext = createContext<CreateContextValue & CreateContextActions>({
    ...defaultValue,
    ...defaultActions,
});

export const CreateProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState(defaultValue);
    const defaultVault = useSelector(selectDefaultVault);
    const user = useSelector(selectUser);

    /** Failures leave the list empty: `CreateService` refetches on reconnect */
    const fetchServices = useCallback(async () => {
        try {
            const response = await fetch(PASS_POPULAR_SERVICES_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const services: RemoteService[] = await response.json();
            setState((state) => ({ ...state, services }));
        } catch (error) {
            logger.warn(`[Onboarding] Could not fetch popular services (${getErrorMessage(error)})`);
        }
    }, []);

    const createLogin = useCallback((): MaybeNull<ItemCreateIntent<'login'>> => {
        const shareId = defaultVault?.shareId;
        if (!shareId || !state.service) return null;

        const optimisticId = uniqueId();

        const builder = itemBuilder('login');
        builder.get('metadata').set('name', state.service.title).set('itemUuid', optimisticId);
        builder
            .get('content')
            .set(
                'autofillUrls',
                state.service.urls.map((url) => ({ url, mode: AutofillMode.Default }))
            )
            .set('itemEmail', user?.Email ?? '')
            .set('password', state.password);

        return {
            ...builder.data,
            optimisticId,
            shareId,
            files: { toAdd: [], toRemove: [] },
            extraData: { withAlias: false },
            folderId: null,
        };
    }, [defaultVault, state, user]);

    return (
        <CreateContext.Provider value={{ ...state, fetchServices, setState, createLogin }}>
            {children}
        </CreateContext.Provider>
    );
};

export const useCreateContext = createUseContext(CreateContext);
