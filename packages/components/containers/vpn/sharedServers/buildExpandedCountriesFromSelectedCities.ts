export function buildExpandedCountriesFromSelectedCities(selectedCities: Record<string, string[]>) {
    const expanded: Record<string, boolean> = {};

    for (const country of Object.keys(selectedCities)) {
        expanded[country] = true;
    }

    return expanded;
}
