import { getMember as getMemberConfig } from '@proton/shared/lib/api/members';
import type { Api, Member } from '@proton/shared/lib/interfaces';

export const getMember = (api: Api, memberID: string) =>
    api<{
        Member: Member;
    }>(getMemberConfig(memberID)).then(({ Member }) => Member);
