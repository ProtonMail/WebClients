import useApi from '@proton/components/hooks/useApi';
import { useFetchData } from '@proton/components/hooks/useFetchData';

import { queryLocationFilter } from './api';

// Reuse your existing types or adapt them as needed
interface VpnLocationFilterPolicy {
    VpnLocationFilterPolicyID: number;
    State: number;
    Name: string;
    Type: number;
    OrganizationID: number;
    Locations: SharedServerLocation[];
    Groups: SharedServerGroup[];
    Users: SharedServerUser[];
    Code: number;
}

interface SharedServerLocation {
    Country: string;
    City: string;
}

interface SharedServerUser {
    UserID: number;
    FullName: string;
}

interface SharedServerGroup {
    GroupID: number;
    Name: string;
}

interface ApiResponse {
    VpnLocationFilterPolicyResponse: VpnLocationFilterPolicy[];
    Locations: SharedServerLocation[];
    Users: SharedServerUser[];
    Groups: SharedServerGroup[];
    Code: number;
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
        policies: result?.VpnLocationFilterPolicyResponse || [],
        locations: result?.Locations || [],
        users: result?.Users || [],
        groups: result?.Groups || [],
        refresh,
    };
};

export default useSharedServers;
