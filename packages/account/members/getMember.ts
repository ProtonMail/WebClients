import { getMember as getMemberConfig } from '@proton/shared/lib/api/members';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Member } from '@proton/shared/lib/interfaces/Member';

export const getMember = (api: Api, memberID: string) =>
    api<{
        Member: Member;
    }>(getMemberConfig(memberID)).then(({ Member }) => Member);
