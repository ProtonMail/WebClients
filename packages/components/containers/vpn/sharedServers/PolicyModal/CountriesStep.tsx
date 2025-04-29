import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Input } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';
import clsx from '@proton/utils/clsx';

interface CountriesGroup {
    country: string;
    localizedCountryName: string;
    cities: string[];
}

interface SharedServersCountriesStepProps {
    isEditing: boolean;
    policyName: string;
    groupedLocations: CountriesGroup[];
    selectedCities: Record<string, string[]>;
    onSelectCountry: (countryCode: string, cities: string[]) => void;
    onSelectCity: (countryCode: string, city: string) => void;
    onSelectAllCities: () => void;
}

const CountriesStep = ({
    isEditing,
    policyName,
    groupedLocations,
    selectedCities,
    onSelectCountry,
    onSelectCity,
    onSelectAllCities,
}: SharedServersCountriesStepProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

    const filteredGroups = useMemo(() => {
        if (!searchQuery) {
            return groupedLocations;
        }

        return groupedLocations.filter(({ localizedCountryName }) =>
            localizedCountryName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [groupedLocations, searchQuery]);

    const allCitiesCount = useMemo(() => groupedLocations.reduce((p, c) => p + c.cities.length, 0), [groupedLocations]);
    const selectedCountriesCount = useMemo(
        () => Object.keys(selectedCities).reduce((p, c) => p + Number(selectedCities[c].length > 0), 0),
        [selectedCities]
    );

    const onToggleCountry = (countryCode: string) =>
        setExpandedCountries((prev) => ({
            ...prev,
            [countryCode]: !prev[countryCode],
        }));

    return (
        <div style={{ maxHeight: '60vh', height: 600, overflow: 'auto' }}>
            {isEditing && <span className="text-sm">{policyName}</span>}

            <div className="my-4 w-full">
                <Input
                    placeholder={c('Action').t`Search`}
                    prefix={<Icon name="magnifier" />}
                    className="pl-0"
                    value={searchQuery}
                    onChange={({ target }) => setSearchQuery(target.value)}
                />
            </div>

            <Table responsive="stacked" hasActions className="unstyled my-0">
                <TableBody>
                    <TableRow>
                        <TableCell>
                            <div className="flex gap-4 w-full items-center">
                                <Checkbox
                                    checked={allCitiesCount <= selectedCountriesCount}
                                    onChange={onSelectAllCities}
                                />
                                <span className="text-bold">{c('Label').t`Countries`}</span>
                                {selectedCountriesCount > 0 && (
                                    <span className="text-sm color-weak">
                                        {c('CountriesStep:Info').ngettext(
                                            msgid`${selectedCountriesCount} selected`,
                                            `${selectedCountriesCount} selected`,
                                            selectedCountriesCount
                                        )}
                                    </span>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                    {filteredGroups.map(({ country, localizedCountryName, cities }) => {
                        const selectedCount = selectedCities[country]?.length ?? 0;
                        const allCitiesSelected = selectedCount === cities.length;
                        const isExpanded =
                            expandedCountries[country] ||
                            (expandedCountries[country] !== false && selectedCities[country]?.length > 0);

                        return (
                            <React.Fragment key={country}>
                                <TableRow onClick={() => onToggleCountry(country)} className="cursor-pointer">
                                    <TableCell>
                                        <div
                                            className={clsx(
                                                'flex items-center gap-4',
                                                !allCitiesSelected && 'opacity-50'
                                            )}
                                        >
                                            <Checkbox
                                                id={`country-${country}`}
                                                checked={allCitiesSelected}
                                                onChange={() =>
                                                    cities.length > 1
                                                        ? onSelectCountry(country, cities)
                                                        : onSelectCity(country, cities[0])
                                                }
                                                aria-label={c('Action').t`Select country ${country}`}
                                            />
                                            <CountryFlagAndName
                                                countryCode={country}
                                                countryName={localizedCountryName}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {isExpanded &&
                                    cities.length > 1 &&
                                    cities.map((city) => {
                                        const isChecked = selectedCities[country]?.includes(city) || false;
                                        return (
                                            <TableRow key={`${country}-${city}`}>
                                                <TableCell>
                                                    <div
                                                        className={clsx(
                                                            'flex items-center gap-4 ml-8',
                                                            !isChecked && 'opacity-50'
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`city-${country}-${city}`}
                                                            checked={isChecked}
                                                            onChange={() => onSelectCity(country, city)}
                                                            aria-label={c('Action').t`Select city ${city}`}
                                                        />
                                                        <Icon name="map-pin" />
                                                        <span className="whitespace-nowrap">{city}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default CountriesStep;
