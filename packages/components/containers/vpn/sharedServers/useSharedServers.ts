import useApi from '@proton/components/hooks/useApi';
import { useFetchData } from '@proton/components/hooks/useFetchData';

import {
    type CitiesTranslationsApiResponse,
    type SharedServerLocation,
    queryCitiesTranslations,
    queryLocationFilter,
} from './api';

// Reuse your existing types or adapt them as needed
export interface VpnLocationFilterPolicy {
    Code: number;
    Groups: SharedServerGroup[];
    LocationFilterPolicyID: number | null;
    Locations: SharedServerLocation[];
    Name: string;
    OrganizationID: number;
    State: number;
    Type: number;
    Users: SharedServerUser[];
}

export interface SharedServerUser {
    UserID: number;
    Name: string;
    Email: string;
}

export interface SharedServerGroup {
    GroupID: number;
    Name: string;
    UserCount: number;
    Users: SharedServerUser[];
}

interface ApiResponse {
    Code: number;
    FilterPolicies: VpnLocationFilterPolicy[];
    Groups: SharedServerGroup[];
    Locations: SharedServerLocation[];
    Users: SharedServerUser[];
    EmailsOfUsersNotInAnyPolicy: string[];
}

export const useSharedServers = (maxAge: number) => {
    const api = useApi();

    // Define how we fetch data for SharedServers
    const fetcher = async () => {
        // You could do more logic here if needed, but basically just call the API
        return api<ApiResponse>(queryLocationFilter());
    };

    // Use the generic fetch-data hook
    const { loading, result, refresh } = useFetchData<ApiResponse>({
        fetcher,
        maxAge,
    });

    // Fetch cities translations
    const translations = useFetchData<CitiesTranslationsApiResponse>({
        fetcher: () => api<CitiesTranslationsApiResponse>(queryCitiesTranslations()),
        maxAge: Number.MAX_SAFE_INTEGER,
    });

    // Now you can define convenience return values from the result
    return {
        loading,
        policies: result?.FilterPolicies || [],
        locations: result?.Locations || [],
        translations,
        users: result?.Users || [],
        groups: result?.Groups || [],
        refresh,
        countUsersNotInAnyPolicy: result?.EmailsOfUsersNotInAnyPolicy?.length ?? 0,
    };
};

export default useSharedServers;
