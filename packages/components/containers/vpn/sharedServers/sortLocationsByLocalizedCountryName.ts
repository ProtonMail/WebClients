import type { SharedServerLocation } from '@proton/components/containers/vpn/sharedServers/api';
import type { CountryOptions } from '@proton/payments';
import { getLocalizedCountryByAbbr } from '@proton/payments';

export function sortLocationsByLocalizedCountryName(locations: SharedServerLocation[], countryOptions: CountryOptions) {
    const countryMap = new Map<string, { localizedName: string; cities: Set<string> }>();

    for (const loc of locations) {
        const localizedName = getLocalizedCountryByAbbr(loc.Country, countryOptions) || loc.Country;

        if (!countryMap.has(loc.Country)) {
            countryMap.set(loc.Country, { localizedName, cities: new Set() });
        }
        countryMap.get(loc.Country)?.cities.add(loc.City);
    }

    const groupedLocations = Array.from(countryMap, ([country, { localizedName, cities }]) => ({
        country,
        localizedCountryName: localizedName,
        cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
    })).sort((a, b) => a.localizedCountryName.localeCompare(b.localizedCountryName));

    const sortedLocations = groupedLocations.map((group) => ({
        Country: group.country,
        localizedCountryName: group.localizedCountryName,
    }));

    return {
        sortedLocations,
        groupedLocations,
        countriesCount: groupedLocations.length,
    };
}
