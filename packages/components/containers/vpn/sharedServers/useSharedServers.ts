import useApi from '@proton/components/hooks/useApi';
import { useFetchData } from '@proton/components/hooks/useFetchData';

import { queryLocationFilter } from './api';

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

export interface SharedServerLocation {
    Country: string;
    City: string;
}

export interface SharedServerUser {
    UserID: number;
    Name: string;
    Email: string;
}

export interface SharedServerGroup {
    GroupID: number;
    Name: string;
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

    // Now you can define convenience return values from the result
    return {
        loading,
        policies: result?.FilterPolicies || [],
        locations: result?.Locations || [],
        users: result?.Users || [],
        groups: result?.Groups || [],
        refresh,
        countUsersNotInAnyPolicy: result?.EmailsOfUsersNotInAnyPolicy?.length ?? 0,
    };
};

export default useSharedServers;
