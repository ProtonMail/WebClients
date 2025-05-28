import type { SharedServerLocation } from '@proton/components/containers/vpn/sharedServers/api';

export function buildSelectedCitiesFromLocations(locations: SharedServerLocation[] = []): Record<string, string[]> {
    const citiesMap: Record<string, string[]> = {};

    for (const { Country, City } of locations) {
        if (!citiesMap[Country]) {
            citiesMap[Country] = [];
        }
        if (!citiesMap[Country].includes(City)) {
            citiesMap[Country].push(City);
        }
    }

    return citiesMap;
}
