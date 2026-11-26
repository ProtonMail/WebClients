import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import noop from '@proton/utils/noop';

import {
    MEMBERS_LUMO_API_MAX_PAGE_SIZE,
    type MembersLumoApiResponse,
    getMembersLumoApiRequest,
    updateAllMembersLumoApiRequest,
    updateMemberLumoApiRequest,
} from '../../remote/memberLumoApi';

type MembersLumoApiState = {
    enabledByMemberId: Record<string, boolean>;
    error: boolean;
};

export const useMembersLumoApi = () => {
    const api = useApi();
    const [state, setState] = useState<MembersLumoApiState>({ enabledByMemberId: {}, error: false });

    useEffect(() => {
        queryPages(
            (Page, PageSize) =>
                api<MembersLumoApiResponse>({ ...getMembersLumoApiRequest({ Page, PageSize }), silence: true }),
            { pageSize: MEMBERS_LUMO_API_MAX_PAGE_SIZE }
        ).then(
            (pages) => {
                const members = pages.flatMap(({ Members }) => Members);
                setState({
                    enabledByMemberId: Object.fromEntries(
                        members.map((member) => [member.MemberID, member.LumoApiEnabled])
                    ),
                    error: false,
                });
            },
            () => setState({ enabledByMemberId: {}, error: true })
        );
    }, []);

    const setApiAccess = (memberId: string, enabled: boolean) =>
        api(updateMemberLumoApiRequest(memberId, enabled)).then(
            () =>
                setState((previous) => ({
                    ...previous,
                    enabledByMemberId: { ...previous.enabledByMemberId, [memberId]: enabled },
                })),
            noop
        );

    const setApiAccessForEveryone = (enabled: boolean) =>
        api(updateAllMembersLumoApiRequest(enabled)).then(
            () =>
                setState((previous) => ({
                    ...previous,
                    enabledByMemberId: Object.fromEntries(
                        Object.keys(previous.enabledByMemberId).map((memberId) => [memberId, enabled])
                    ),
                })),
            noop
        );

    return { ...state, setApiAccess, setApiAccessForEveryone };
};
