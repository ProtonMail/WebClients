import { useMemo } from 'react';

const getMaxForCountry = (country: string, remainingCount: number, deletedInCountries: Record<string, number>) =>
    remainingCount -
    Object.keys(deletedInCountries).reduce(
        (count, otherCountry) => count + (country === otherCountry ? 0 : deletedInCountries[country]),
        0
    );

export const useSpecificCountryCount = (
    model: { quantities?: Record<string, number> },
    remainingCount: number,
    deletedInCountries: Record<string, number>
) =>
    useMemo(
        () =>
            Object.keys(model.quantities || {}).reduce(
                (total, country) =>
                    total +
                    Math.max(
                        0,
                        (model.quantities?.[country] || 0) -
                            getMaxForCountry(country, remainingCount, deletedInCountries)
                    ),
                0
            ),
        [model, remainingCount, deletedInCountries]
    );
