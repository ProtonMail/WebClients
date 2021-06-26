import { queryAddresses } from '@proton/shared/lib/api/members';
import { Address, Member } from '@proton/shared/lib/interfaces';
import useCache from './useCache';
import useApi from './useApi';
import usePromiseResult from './usePromiseResult';
import { cachedPromise } from './helpers/cachedPromise';
import { useAddresses } from './useAddresses';

const useMemberAddresses = (members: Member[]) => {
    const cache = useCache();
    const api = useApi();
    const [addresses] = useAddresses();

    return usePromiseResult(async () => {
        if (!Array.isArray(members)) {
            return;
        }

        const memberAddresses = await Promise.all(
            members.map((member) => {
                if (member.Self) {
                    return Promise.resolve(addresses);
                }
                return cachedPromise(
                    cache,
                    member.ID,
                    () => {
                        return api<{ Addresses?: Address[] }>(queryAddresses(member.ID)).then(
                            ({ Addresses = [] }) => Addresses
                        );
                    },
                    member
                );
            })
        );

        return members.reduce<{ [id: string]: Address[] }>((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: memberAddresses[i],
            };
        }, {});
    }, [members, addresses]);
};

export default useMemberAddresses;
