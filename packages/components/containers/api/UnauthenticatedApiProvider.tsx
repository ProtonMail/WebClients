import type { ReactNode } from 'react';

import { ApiContext } from '@proton/app-context/apiContext';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import ApiModalsHV from './ApiModalsHV';
import UnauthenticatedApiChallenge from './UnauthenticatedApiChallenge';

interface Props {
    children: ReactNode;
    unauthenticatedApi: UnauthenticatedApi;
}

const UnauthenticatedApiProvider = ({ unauthenticatedApi, children }: Props) => {
    return (
        <>
            <UnauthenticatedApiChallenge unauthenticatedApi={unauthenticatedApi} />
            {/* The api modals are rendered outside of this provider, so this session answers its own challenges */}
            <ApiModalsHV api={unauthenticatedApi.apiCallback} events={unauthenticatedApi} />
            <ApiContext.Provider value={unauthenticatedApi.apiCallback}>{children}</ApiContext.Provider>
        </>
    );
};

export default UnauthenticatedApiProvider;
