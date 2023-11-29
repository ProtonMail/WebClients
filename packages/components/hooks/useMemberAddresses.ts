import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import { Address, Member, PartialMemberAddress } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';

import { cachedPromise } from './helpers/cachedPromise';
import { useAddresses } from './useAddresses';
import useApi from './useApi';
import useCache from './useCache';
import usePromiseResult from './usePromiseResult';

export function useMemberAddresses(
    members: Member[] | undefined,
    partial: true
): [{ [id: string]: PartialMemberAddress[] } | undefined, boolean, any];
export function useMemberAddresses(
    members: Member[] | undefined,
    partial?: false
): [{ [id: string]: Address[] } | undefined, boolean, any];

export function useMemberAddresses(members: Member[] | undefined, partial?: boolean) {
    const cache = useCache();
    const api = useApi();
    const [addresses] = useAddresses();

    return usePromiseResult(async () => {
        if (!Array.isArray(members)) {
            return;
        }

        const memberAddresses = await Promise.all(
            members.map((member) => {
                const key = `member-addresses-${member.ID}`;
                if (member.Self) {
                    return Promise.resolve(addresses || []);
                }
                // Prefer only addresses (partial) from member if the addresses haven't been fetched
                if (member.Addresses && partial && !cache.has(key)) {
                    return Promise.resolve(member.Addresses);
                }
                return cachedPromise(
                    cache,
                    key,
                    () => {
                        return getAllMemberAddresses(api, member.ID).then(sortAddresses);
                    },
                    member
                );
            })
        );

        return members.reduce<{ [id: string]: Address[] | PartialMemberAddress[] }>((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: memberAddresses[i],
            };
        }, {});
    }, [members, addresses]);
}
