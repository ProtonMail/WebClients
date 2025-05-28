import type { CountryOptions } from '@proton/payments';
import { getLocalizedCountryByAbbr } from '@proton/payments';

import type { CitiesTranslations, CountryCitiesTranslations, SharedServerLocation } from '../api';

export interface GroupedLocation {
    /** Country code */
    country: string;
    localizedCountryName: string;
    cities: string[];
    localizedCities: CountryCitiesTranslations;
}

export function getGroupedLocations(
    locations: SharedServerLocation[],
    countryOptions: CountryOptions,
    citiesTranslations: CitiesTranslations
): GroupedLocation[] {
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
    const groups = sortedLocations.reduce(
        (groups_, loc) => {
            groups_[loc.Country] ??= {
                country: loc.Country,
                localizedCountryName: loc.localizedCountryName,
                cities: [],
                localizedCities: {},
            };
            groups_[loc.Country].cities.push(loc.City);
            groups_[loc.Country].localizedCities[loc.City] = citiesTranslations[loc.Country][loc.City] || loc.City;
            return groups_;
        },
        {} as Record</** country code */ string, GroupedLocation>
    );

    // Convert to array, sort cities and sort countries; by localized names
    return Object.values(groups)
        .map(({ cities, ...loc }) => ({
            ...loc,
            cities: cities.sort((a, b) => loc.localizedCities[a]!.localeCompare(loc.localizedCities[b]!)),
        }))
        .sort((a, b) => a.localizedCountryName.localeCompare(b.localizedCountryName));
}
