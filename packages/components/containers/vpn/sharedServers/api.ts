export const queryLocationFilter = () => ({
    url: 'vpn/v1/business/location-filter',
    method: 'get',
});

export interface SharedServerLocation {
    Country: string;
    City: string;
}

export interface FilterPolicyRequest {
    ID: number | null;
    Name: string;
    Type: number;
    State: number;
    Locations: SharedServerLocation[];
    UserIds: number[] | null;
    GroupIds: number[] | null;
}

export interface CreateLocationFilterPayload {
    FilterPoliciesInput: FilterPolicyRequest[];
}

export const createLocationFilter = (payload: CreateLocationFilterPayload) => ({
    url: 'vpn/v1/business/location-filter',
    method: 'POST',
    data: payload,
});
