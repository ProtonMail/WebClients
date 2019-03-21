import { createContext } from 'react';
import { queryMembers, queryAddresses } from 'proton-shared/lib/api/members';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return async () => {
        const Members = await api(queryMembers()).then(({ Members }) => Members);
        return Promise.all(
            Members.map(async (member) => {
                const { Addresses = [] } = await api(queryAddresses(member.ID));
                return {
                    ...member,
                    addresses: Addresses
                };
            })
        );
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const MembersContext = createContext();
export const MembersProvider = createProvider(MembersContext, providerValue);
export const useMembers = createUseModelHook(MembersContext);
