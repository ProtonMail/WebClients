export const queryLocationFilter = () => ({
    url: 'vpn/v1/business/location-filter',
    method: 'get',
});

export interface SharedServerLocation {
    /** Country code */
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

export interface CountryCitiesTranslations {
    [/** english */ city: /** translation */ string]: string | null;
}

export interface CitiesTranslations {
    [countryCode: string]: CountryCitiesTranslations;
}

export interface CitiesTranslationsApiResponse {
    Cities: CitiesTranslations;
    Code: number;
    Language: string;
}

/**
 * Query for the translations of city/state names based on country codes.
 *
 * API returns e.g.:
 * {
 *   "US": {
 *     "CA": "California",
 *     "Los Angeles": "Los Angeles",
 *     "San Francisco": null,      // No translation available in current locale, you should fallback to the original name
 *   },
 * }
 */
export const queryCitiesTranslations = () => ({
    url: 'vpn/v1/cities/names',
    method: 'get',
});
