import React, { useCallback, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Input } from '@proton/atoms/Input/Input';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';
import clsx from '@proton/utils/clsx';

import type { GroupedLocation } from './getGroupedLocations';

interface SharedServersCountriesStepProps {
    loading?: boolean;
    isEditing: boolean;
    policyName: string;
    groupedLocations: GroupedLocation[];
    selectedCities: Record<string, string[]>;
    onSelectCountry: (countryCode: string, cities: string[]) => void;
    onSelectCity: (countryCode: string, city: string) => void;
    onSelectAllCities: () => void;
}

const CountriesStep = ({
    loading,
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
    const [selectedCountriesCount, selectedCitiesCount] = useMemo(
        () =>
            Object.keys(selectedCities).reduce(
                ([p1, p2], c) => [p1 + Number(selectedCities[c].length > 0), p2 + selectedCities[c].length],
                [0, 0]
            ),
        [selectedCities]
    );

    const onToggleCountryExpanded = useCallback(
        (countryCode: string) =>
            setExpandedCountries((prev) => ({
                ...prev,
                [countryCode]: !prev[countryCode],
            })),
        []
    );

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
                                    checked={selectedCitiesCount >= allCitiesCount}
                                    onChange={onSelectAllCities}
                                />
                                <span className="text-bold">{c('Label').t`Countries`}</span>
                                {selectedCountriesCount > 0 && (
                                    <span
                                        className="text-sm color-weak"
                                        title={c('CountriesStep:Info').ngettext(
                                            msgid`${selectedCitiesCount} cities selected`,
                                            `${selectedCitiesCount} cities selected`,
                                            selectedCitiesCount
                                        )}
                                    >
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
                    {loading && (
                        <div className="flex flex-nowrap">
                            <CircleLoader />
                        </div>
                    )}
                    {filteredGroups.map(({ country, localizedCountryName, cities, localizedCities }) => {
                        const selectedCount = selectedCities[country]?.length ?? 0;
                        const isAllCitiesSelected = selectedCount === cities.length;
                        const isPartiallySelected = selectedCount > 0 && selectedCount < cities.length;
                        const isExpanded = (expandedCountries[country] ||=
                            expandedCountries[country] !== false && selectedCities[country]?.length > 0);

                        const checkboxId = `country-${country}`;

                        return (
                            <React.Fragment key={country}>
                                <TableRow
                                    onClick={(ev) => {
                                        // Ignore clicks on the checkbox when the country is expanded but not selected, or fully selected and collapsed; to not shrink and select or expand and unselect.
                                        if (
                                            (ev.target as HTMLElement).id === checkboxId &&
                                            isExpanded !== isAllCitiesSelected
                                        ) {
                                            return;
                                        }
                                        onToggleCountryExpanded(country);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <TableCell>
                                        <div className={clsx('flex items-center gap-4')}>
                                            <Checkbox
                                                id={checkboxId}
                                                checked={isAllCitiesSelected}
                                                indeterminate={isPartiallySelected}
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
                                                    <div className={clsx('flex items-center gap-4 ml-8')}>
                                                        <Checkbox
                                                            id={`city-${country}-${city}`}
                                                            checked={isChecked}
                                                            onChange={() => onSelectCity(country, city)}
                                                            aria-label={c('Action').t`Select city ${city}`}
                                                        />
                                                        <Icon name="map-pin" />
                                                        <span
                                                            onClick={() => onSelectCity(country, city)}
                                                            className="text-nowrap flex grow cursor-pointer"
                                                        >
                                                            {localizedCities[city]}
                                                        </span>
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
