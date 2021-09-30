import { queryAddresses } from '@proton/shared/lib/api/members';
import { Address, Api, Member } from '@proton/shared/lib/interfaces';
import queryPagesThrottled from '@proton/shared/lib/api/helpers/queryPagesThrottled';
import useCache from './useCache';
import useApi from './useApi';
import usePromiseResult from './usePromiseResult';
import { cachedPromise } from './helpers/cachedPromise';
import { useAddresses } from './useAddresses';

export const getAllMemberAddresses = (api: Api, memberID: string) => {
    const pageSize = 50;

    return queryPagesThrottled({
        requestPage: (page: number) => {
            return api<{ Addresses: Address[]; Total: number }>(
                queryAddresses(memberID, {
                    Page: page,
                    PageSize: pageSize,
                })
            );
        },
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Addresses = [] }) => Addresses).flat();
    });
};

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
                        return getAllMemberAddresses(api, member.ID);
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
