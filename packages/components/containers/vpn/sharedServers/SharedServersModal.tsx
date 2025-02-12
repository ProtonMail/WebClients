import React, { Fragment, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button, Input } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';
import { PolicyState, PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getCountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { MINUTE } from '@proton/shared/lib/constants';

import ApplyPolicyButton from './ApplyPolicyButton';
import type { CreateLocationFilterPayload, FilterPolicyRequest } from './api';
import { createLocationFilter } from './api';
import type { SharedServerUser, VpnLocationFilterPolicy } from './useSharedServers';
import { useSharedServers } from './useSharedServers';

enum STEP {
    NAME,
    MEMBERS,
    COUNTRIES,
}

interface Props extends ModalProps<typeof Form> {
    policy?: VpnLocationFilterPolicy;
}

const SharedServersModal = ({ policy, ...rest }: Props) => {
    const { locations, policies, users } = useSharedServers(10 * MINUTE);
    const api = useApi();
    const [step, setStep] = useState(STEP.NAME);
    const [policyName, setPolicyName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<SharedServerUser[]>(users);
    const [applyPolicyTo, setApplyPolicyTo] = useState<string>('users');
    const { createNotification } = useNotifications();
    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);

    // New state to store selected cities per country
    const [selectedCities, setSelectedCities] = useState<Record<string, string[]>>({});
    // State to control which countries are expanded
    const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

    const { groupedLocations } = useMemo(() => {
        const uniqueCountries = new Set();

        const filteredLocations = locations.filter((location) => {
            if (uniqueCountries.has(location.Country)) {
                return false;
            }

            uniqueCountries.add(location.Country);
            return true;
        });

        const locationsWithLocalizedNames = filteredLocations.map((location) => {
            const localizedCountryName =
                getLocalizedCountryByAbbr(location.Country, countryOptions) || location.Country;
            return {
                ...location,
                localizedCountryName,
            };
        });

        const sortedLocations = [...locationsWithLocalizedNames].sort((a, b) => {
            return a.localizedCountryName.localeCompare(b.localizedCountryName);
        });

        // Group locations by country so that each entry contains its list of cities.
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

        // Convert to an array and sort cities for each country
        const groupedLocations = Object.entries(groups)
            .map(([country, { country: localizedCountryName, cities }]) => ({
                country,
                localizedCountryName,
                cities: cities.sort((a, b) => a.localeCompare(b)),
            }))
            .sort((a, b) => a.localizedCountryName.localeCompare(b.localizedCountryName));

        return { sortedLocations, groupedLocations };
    }, [locations, countryOptions]);

    const handleBack = () => {
        if (step > STEP.NAME) {
            setStep((prev) => prev - 1);
        }
    };

    const handleUserSelection = (user: SharedServerUser) => {
        setSelectedUsers((prevSelectedUsers) => {
            if (prevSelectedUsers.some((selectedUser) => selectedUser.UserID === user.UserID)) {
                return prevSelectedUsers.filter((selectedUser) => selectedUser.UserID !== user.UserID);
            } else {
                return [...prevSelectedUsers, user];
            }
        });
    };

    // Toggle selection of an individual city for a given country.
    const handleCitySelection = (country: string, city: string) => {
        setSelectedCities((prev) => {
            const cities = prev[country] || [];
            if (cities.includes(city)) {
                return { ...prev, [country]: cities.filter((c) => c !== city) };
            } else {
                return { ...prev, [country]: [...cities, city] };
            }
        });
    };

    // Toggle the entire country selection – select/deselect all its cities.
    const handleCountrySelection = (country: string, allCities: string[]) => {
        setSelectedCities((prev) => {
            const current = prev[country] || [];
            const isAllSelected = allCities.every((city) => current.includes(city));
            return {
                ...prev,
                [country]: isAllSelected ? [] : allCities,
            };
        });
    };

    // Toggle whether a country row is expanded to show its cities.
    const toggleCountryExpansion = (country: string) => {
        setExpandedCountries((prev) => ({
            ...prev,
            [country]: !prev[country],
        }));
    };

    const handleApplyPolicyTo = (value: string) => {
        setApplyPolicyTo(value);
    };

    // Create the payload and submit the POST request using the api function.
    const handleSubmit = async () => {
        // Construct the Locations payload based on the selected cities.
        const locationsPayload = Object.entries(selectedCities).flatMap(([country, cities]) =>
            cities.map((city) => ({
                Country: country,
                City: city,
            }))
        );

        // Construct the payload
        const payload: CreateLocationFilterPayload = {
            FilterPoliciesInput: policies.map((policy) => ({
                ID: policy.LocationFilterPolicyID,
                Name: policy.Name,
                Type: policy.Type,
                State: policy.Type === PolicyType.Custom ? policy.State : PolicyState.Inactive,
                Locations: policy.Locations,
                UserIds:
                    policy.Type === PolicyType.Custom && policy.Users.length > 0
                        ? policy.Users.map((user) => user.UserID)
                        : null,
                GroupIds:
                    policy.Type === PolicyType.Custom && policy.Groups.length > 0
                        ? policy.Groups.map((group) => group.GroupID)
                        : null,
            })),
        };

        // Add the custom policy
        const customPolicy: FilterPolicyRequest = {
            ID: null,
            Name: policyName,
            Type: PolicyType.Custom,
            State: PolicyState.Active,
            Locations: locationsPayload,
            UserIds:
                applyPolicyTo === 'users' && selectedUsers.length > 0 ? selectedUsers.map((user) => user.UserID) : null,
            GroupIds: applyPolicyTo === 'groups' ? null : null,
        };

        payload.FilterPoliciesInput.push(customPolicy);

        try {
            // Using the generic api function with a config object
            await api(createLocationFilter(payload));
            createNotification({ text: c('Notification').t`Policy created successfully` });
            if (rest.onClose) {
                rest.onClose();
            }
        } catch (error) {
            createNotification({
                key: 'policy-creation-error',
                text: c('Notification').t`Error creating policy`,
                type: 'warning',
            });
        }
    };

    const handleNext = () => {
        if (step === STEP.COUNTRIES) {
            handleSubmit();
        } else {
            setStep((prev) => prev + 1);
        }
    };

    // Set modal title based on the step.
    const modalTitle = () => {
        switch (step) {
            case STEP.NAME:
                return c('Title').t`Create new policy`;
            case STEP.MEMBERS:
                return c('Title').t`Add users to "${policyName}"`;
            case STEP.COUNTRIES:
                return c('Title').t`Add countries to "${policyName}"`;
            default:
                return '';
        }
    };

    const handlePolicyNameChange = (value: string) => {
        setPolicyName(value);
    };

    return (
        <ModalTwo size="large" as={Form} {...rest}>
            <ModalTwoHeader title={modalTitle()} />

            <ModalTwoContent>
                {step === STEP.NAME && (
                    <InputFieldTwo
                        id="policyName"
                        autoFocus
                        value={policyName}
                        maxLength={40}
                        minLength={3}
                        onValue={handlePolicyNameChange}
                        label={c('Label').t`New policy name`}
                    />
                )}

                {step === STEP.MEMBERS && (
                    <div>
                        <div className="flex flex-column gap-2">
                            <span>Apply policy to</span>
                            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                                <ApplyPolicyButton
                                    onClick={() => handleApplyPolicyTo('users')}
                                    label={c('Label').t`Users`}
                                    isSelected={applyPolicyTo === 'users'}
                                />
                                <ApplyPolicyButton
                                    onClick={() => handleApplyPolicyTo('groups')}
                                    label={c('Label').t`Groups`}
                                    isSelected={applyPolicyTo === 'groups'}
                                />
                            </div>
                        </div>
                        <div className="searchbox self-center my-4 mx-auto">
                            <Input
                                placeholder={c('Action').t`Search`}
                                prefix={<Icon name="magnifier" />}
                                className="pl-0"
                            />
                        </div>

                        <Table responsive="stacked" hasActions>
                            <TableBody>
                                {users.map((user: SharedServerUser) => (
                                    <TableRow key={user.UserID}>
                                        <TableCell>
                                            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                                                <Checkbox
                                                    id={`user-${user.UserID}`}
                                                    checked={selectedUsers.some(
                                                        (selectedUser) => selectedUser.UserID === user.UserID
                                                    )}
                                                    onChange={() => handleUserSelection(user)}
                                                />
                                                <div className="flex flex-column">
                                                    <span>{user.Name}</span>
                                                    {/* Optionally display additional fields like email */}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {step === STEP.COUNTRIES && (
                    <div>
                        <div className="searchbox self-center my-4">
                            <Input
                                placeholder={c('Action').t`Search`}
                                prefix={<Icon name="magnifier" />}
                                className="pl-0"
                            />
                        </div>

                        <Table responsive="stacked" hasActions className="unstyled my-0">
                            <TableBody>
                                {groupedLocations.map(({ country, localizedCountryName, cities }) => (
                                    <Fragment key={country}>
                                        <TableRow>
                                            <TableCell>
                                                <div
                                                    className="flex items-center gap-4"
                                                    onClick={() => toggleCountryExpansion(country)}
                                                >
                                                    {/* Country-level checkbox to select/deselect all its cities */}
                                                    <Checkbox
                                                        id={`country-${country}`}
                                                        checked={
                                                            (selectedCities[country]?.length ?? 0) === cities.length
                                                        }
                                                        onChange={() => handleCountrySelection(country, cities)}
                                                    />
                                                    {/* Display the flag and country name */}
                                                    <CountryFlagAndName
                                                        countryCode={country}
                                                        countryName={localizedCountryName}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedCountries[country] &&
                                            cities.map((city) => (
                                                <TableRow key={`${country}-${city}`}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4 ml-8">
                                                            <Checkbox
                                                                id={`city-${country}-${city}`}
                                                                checked={
                                                                    selectedCities[country]
                                                                        ? selectedCities[country].includes(city)
                                                                        : false
                                                                }
                                                                onChange={() => handleCitySelection(country, city)}
                                                            />
                                                            <Icon name="map-pin" />
                                                            <span>{city}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </ModalTwoContent>

            <ModalTwoFooter>
                {step !== STEP.NAME && <Button onClick={handleBack}>{c('Action').t`Back`}</Button>}
                <Button color="norm" type="button" onClick={handleNext}>
                    {step === STEP.COUNTRIES ? c('Action').t`Save` : c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SharedServersModal;
