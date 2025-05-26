import type { CountryOptions } from '@proton/payments';
import { getLocalizedCountryByAbbr } from '@proton/payments';

import type { SharedServerLocation } from '../useSharedServers';

export interface GroupedLocations {
    country: string;
    localizedCountryName: string;
    cities: string[];
}

export function getGroupedLocations(
    locations: SharedServerLocation[],
    countryOptions: CountryOptions
): GroupedLocations[] {
    const locationsWithLocalized = locations.map((location) => {
        const localized = getLocalizedCountryByAbbr(location.Country, countryOptions) || location.Country;
        return {
            ...location,
            localizedCountryName: localized,
        };
    });

    const sortedLocations = [...locationsWithLocalized].sort((a, b) => {
        return a.localizedCountryName.localeCompare(b.localizedCountryName);
    });

    // Group them
    const groups: Record<string, { country: string; cities: string[] }> = {};
    sortedLocations.forEach((loc) => {
        if (!groups[loc.Country]) {
            groups[loc.Country] = {
                country: loc.localizedCountryName,
                cities: [],
            };
        }
        groups[loc.Country].cities.push(loc.City);
    });

    // Convert to array and sort cities
    return Object.entries(groups)
        .map(([country, { country: cName, cities }]) => ({
            country,
            localizedCountryName: cName,
            cities: cities.sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.localizedCountryName.localeCompare(b.localizedCountryName));
}
