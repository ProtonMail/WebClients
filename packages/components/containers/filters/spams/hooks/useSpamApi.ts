import useApi from '@proton/components/hooks/useApi';
import {
    addIncomingDefault,
    deleteIncomingDefaults,
    getIncomingDefaults,
    updateIncomingDefault,
} from '@proton/shared/lib/api/incomingDefaults';
import {
    addOrgIncomingDefault,
    deleteOrgIncomingDefaults,
    getOrgIncomingDefaults,
    updateOrgIncomingDefault,
} from '@proton/shared/lib/api/orgIncomingDefaults';
import { INCOMING_DEFAULTS_LOCATION } from '@proton/shared/lib/constants';
import type { IncomingDefault } from '@proton/shared/lib/interfaces';

import type { SpamItem, SpamLocation, SpamNavItem } from '../Spams.interfaces';

const LOCATION_BY_TYPE: Record<SpamLocation, number> = {
    SPAM: INCOMING_DEFAULTS_LOCATION.SPAM,
    NON_SPAM: INCOMING_DEFAULTS_LOCATION.INBOX,
    BLOCKED: INCOMING_DEFAULTS_LOCATION.BLOCKED,
};

interface IncomingDefaultsApiResults {
    Code: number;
    IncomingDefaults: IncomingDefault[];
    Total: number;
    GlobalTotal: number;
}

interface IncomingDefaultsApiResult {
    Code: number;
    IncomingDefault: IncomingDefault;
}

interface IncomingDefaultsDeleteApiResult {
    Code: number;
    Responses: [];
}

const getHumanReadableLocation = (location: INCOMING_DEFAULTS_LOCATION): SpamLocation => {
    if (location === LOCATION_BY_TYPE.NON_SPAM) {
        return 'NON_SPAM';
    }
    if (location === LOCATION_BY_TYPE.SPAM) {
        return 'SPAM';
    }

    if (location === LOCATION_BY_TYPE.BLOCKED) {
        return 'BLOCKED';
    }

    throw new Error('location is not valid');
};

export type FetchSpams = (
    location: SpamNavItem,
    search: string | undefined,
    page: number,
    limit: number,
    abortController: AbortController
) => Promise<{ list: SpamItem[]; total: number; globalTotal: number }>;

const useSpamApi = (isOrganization: boolean = false) => {
    const api = useApi();

    const fetchSpams: FetchSpams = async (location, search, page, limit, abortController) => {
        const incomingDefaultParams = {
            Page: page,
            Keyword: search,
            PageSize: limit,
            Location: location === 'ALL' ? undefined : LOCATION_BY_TYPE[location],
        };
        const result = await api<IncomingDefaultsApiResults>({
            ...(isOrganization
                ? getOrgIncomingDefaults(incomingDefaultParams)
                : getIncomingDefaults(incomingDefaultParams)),
            signal: abortController ? abortController.signal : undefined,
        });

        const noResult = !result || !result?.IncomingDefaults || !Array.isArray(result.IncomingDefaults);
        if (noResult) {
            return { list: [], total: 0, globalTotal: 0 };
        }

        const nextList: SpamItem[] = result.IncomingDefaults.map((item) => {
            const base = { id: item.ID, location: getHumanReadableLocation(item.Location) };

            if (item.Domain) {
                return { ...base, domain: item.Domain };
            }

            if (item.Email) {
                return { ...base, email: item.Email };
            }

            throw new Error('Item is invalid');
        });

        return { list: nextList, total: result.Total, globalTotal: result.GlobalTotal };
    };

    const insertSpam = async (location: SpamLocation, type: 'email' | 'domain', name: string) => {
        const params = {
            Location: LOCATION_BY_TYPE[location],
            Domain: type === 'domain' ? name : undefined,
            Email: type === 'email' ? name : undefined,
        };
        return api<IncomingDefaultsApiResult>(
            isOrganization ? addOrgIncomingDefault(params) : addIncomingDefault(params)
        );
    };

    const updateSpam = async (id: string, nextLocation: SpamLocation) => {
        const params = { Location: LOCATION_BY_TYPE[nextLocation] };
        return api<IncomingDefaultsApiResult>(
            isOrganization ? updateOrgIncomingDefault(id, params) : updateIncomingDefault(id, params)
        );
    };

    const deleteSpam = async (id: string) => {
        return api<IncomingDefaultsDeleteApiResult>(
            isOrganization ? deleteOrgIncomingDefaults([id]) : deleteIncomingDefaults([id])
        );
    };

    return { fetchSpams, insertSpam, updateSpam, deleteSpam };
};

export default useSpamApi;
