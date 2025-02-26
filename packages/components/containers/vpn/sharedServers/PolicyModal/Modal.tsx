import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { buildExpandedCountriesFromSelectedCities } from '@proton/components/containers/vpn/sharedServers/buildExpandedCountriesFromSelectedCities';
import { buildSelectedCitiesFromLocations } from '@proton/components/containers/vpn/sharedServers/buildSelectedCitiesFromLocations';
import { PolicyState, PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import { mapPoliciesToFilterRequest } from '@proton/components/containers/vpn/sharedServers/mapPoliciesToFilterRequest';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getCountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { MINUTE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { CreateLocationFilterPayload, FilterPolicyRequest } from '../api';
import { createLocationFilter } from '../api';
import { useSharedServers } from '../useSharedServers';
import type { SharedServerGroup, SharedServerUser, VpnLocationFilterPolicy } from '../useSharedServers';
import CountriesStep from './CountriesStep';
import MembersStep from './MembersStep';
import NameStep from './NameStep';

enum STEP {
    NAME,
    MEMBERS,
    COUNTRIES,
}

interface SharedServersModalProps extends ModalProps {
    onSuccess?: () => void;
    policy?: VpnLocationFilterPolicy;
    isEditing?: boolean;
}

const SharedServersModal = ({ policy, isEditing = false, onSuccess, ...rest }: SharedServersModalProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { locations, policies, users, groups } = useSharedServers(10 * MINUTE);
    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);

    const [step, setStep] = useState<STEP>(STEP.NAME);
    const [policyName, setPolicyName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<SharedServerUser[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<SharedServerGroup[]>([]);
    const [applyPolicyTo, setApplyPolicyTo] = useState<'users' | 'groups'>('users');
    const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
    const [selectedCities, setSelectedCities] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!isEditing || !policy) {
            return;
        }
        setPolicyName(policy.Name ?? '');
        setSelectedUsers(policy.Users || []);
        setSelectedGroups(policy.Groups || []);
        const hasUsers = Boolean(policy.Users?.length);
        const hasGroups = Boolean(policy.Groups?.length);

        setApplyPolicyTo((hasGroups && !hasUsers) ? 'groups' : 'users');

        const map = buildSelectedCitiesFromLocations(policy.Locations || []);
        setSelectedCities(map);

        const expanded = buildExpandedCountriesFromSelectedCities(map);
        setExpandedCountries(expanded);
    }, [isEditing, policy]);

    const { groupedLocations } = useMemo(() => {
        const uniqueCountries = new Set();
        const filteredLocations = locations.filter((location) => {
            if (uniqueCountries.has(location.Country)) {
                return false;
            }
            uniqueCountries.add(location.Country);
            return true;
        });

        const locationsWithLocalized = filteredLocations.map((location) => {
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
        const groupedLocations = Object.entries(groups)
            .map(([country, { country: cName, cities }]) => ({
                country,
                localizedCountryName: cName,
                cities: cities.sort((a, b) => a.localeCompare(b)),
            }))
            .sort((a, b) => a.localizedCountryName.localeCompare(b.localizedCountryName));

        return { groupedLocations };
    }, [locations, countryOptions]);

    const handleBack = useCallback(() => {
        if (step === STEP.NAME) {
            return;
        }
        setStep((currentStep) => currentStep - 1);
    }, [step]);

    const handleSubmit = useCallback(async () => {
        try {
            const updatedPolicy: FilterPolicyRequest = {
                // existing ID if editing, otherwise null for new
                ID: isEditing && policy ? policy.LocationFilterPolicyID : null,
                Name: policyName,
                Type: PolicyType.Custom,
                State: PolicyState.Active,
                Locations: Object.entries(selectedCities).flatMap(([country, cityList]) =>
                    cityList.map((city) => ({ Country: country, City: city }))
                ),
                UserIds: applyPolicyTo === 'users' && selectedUsers.length ? selectedUsers.map((u) => u.UserID) : null,
                GroupIds:
                    applyPolicyTo === 'groups' && selectedGroups.length ? selectedGroups.map((u) => u.GroupID) : null,
            };

            const FilterPoliciesInput: FilterPolicyRequest[] = mapPoliciesToFilterRequest(
                policies,
                true,
                policy,
                updatedPolicy
            );

            if (!isEditing) {
                FilterPoliciesInput.push(updatedPolicy);
            }

            const payload: CreateLocationFilterPayload = {
                FilterPoliciesInput,
            };

            await api(createLocationFilter(payload));
            onSuccess?.();

            createNotification({
                text: isEditing
                    ? c('Success').t`Policy updated successfully!`
                    : c('Success').t`Policy created successfully!`,
                type: 'success',
            });

            rest.onClose?.();
        } catch (error) {
            createNotification({
                text: isEditing ? c('Error').t`Error updating policy.` : c('Error').t`Error creating policy.`,
                type: 'error',
            });
        }
    }, [
        api,
        policies,
        selectedCities,
        selectedUsers,
        createNotification,
        isEditing,
        policy,
        policyName,
        applyPolicyTo,
        rest,
    ]);

    const handleNext = useCallback(() => {
        if (step === STEP.NAME) {
            if (policyName.length < 3 || policyName.length > 40) {
                createNotification({
                    text: c('Error').t`The policy name must be between 3 and 40 characters.`,
                    type: 'error',
                });

                return;
            }
        }

        if (step === STEP.MEMBERS) {
            const noUserSelected = applyPolicyTo === 'users' && selectedUsers.length === 0;
            const noGroupSelected = applyPolicyTo === 'groups' && selectedGroups.length === 0;

            if (noUserSelected || noGroupSelected) {
                createNotification({
                    text: c('Error').t`Please select at least one user or group before continuing.`,
                    type: 'error',
                });

                return;
            }
        }

        if (step === STEP.COUNTRIES) {
            const totalSelectedCities = Object.values(selectedCities).flat().length;

            if (totalSelectedCities === 0) {
                createNotification({
                    text: c('Error').t`Please select at least one location before continuing.`,
                    type: 'error',
                });

                return;
            }

            // Submit in this step
            handleSubmit().catch(noop);
            return;
        }

        setStep((currentStep) => currentStep + 1);
    }, [step, handleSubmit]);

    const modalTitle = () => {
        if (!isEditing) {
            if (step === STEP.NAME) {
                return c('Title').t`Create new policy`;
            }
            if (step === STEP.MEMBERS) {
                return c('Title').t`Add users to "${policyName}"`;
            }
            if (step === STEP.COUNTRIES) {
                return c('Title').t`Add countries to "${policyName}"`;
            }
        } else {
            if (step === STEP.NAME) {
                return c('Title').t`Edit name`;
            }
            if (step === STEP.MEMBERS) {
                return c('Title').t`Edit users`;
            }
            if (step === STEP.COUNTRIES) {
                return c('Title').t`Edit countries`;
            }
        }
        return '';
    };

    return (
        <ModalTwo size="large" as={Form} {...rest}>
            <ModalTwoHeader title={modalTitle()} />
            <ModalTwoContent>
                {step === STEP.NAME && <NameStep policyName={policyName} onChangePolicyName={setPolicyName} />}

                {step === STEP.MEMBERS && (
                    <MembersStep
                        isEditing={isEditing as boolean}
                        policyName={policyName}
                        users={users}
                        selectedUsers={selectedUsers}
                        groups={groups}
                        selectedGroups={selectedGroups}
                        onSelectUser={(user) => {
                            setSelectedUsers((previouslySelectedUsers) => {
                                const exists = previouslySelectedUsers.some((u) => u.UserID === user.UserID);
                                return exists
                                    ? previouslySelectedUsers.filter((u) => u.UserID !== user.UserID)
                                    : [...previouslySelectedUsers, user];
                            });
                        }}
                        onSelectGroup={(group) => {
                            setSelectedGroups((previouslySelectedGroups) => {
                                const exists = previouslySelectedGroups.some((g) => g.GroupID === group.GroupID);
                                return exists
                                    ? previouslySelectedGroups.filter((g) => g.GroupID !== group.GroupID)
                                    : [...previouslySelectedGroups, group];
                            });
                        }}
                        applyPolicyTo={applyPolicyTo}
                        onChangeApplyPolicyTo={setApplyPolicyTo}
                    />
                )}

                {step === STEP.COUNTRIES && (
                    <CountriesStep
                        isEditing={isEditing as boolean}
                        policyName={policyName}
                        groupedLocations={groupedLocations}
                        expandedCountries={expandedCountries}
                        selectedCities={selectedCities}
                        onToggleCountry={(countryCode) =>
                            setExpandedCountries((prev) => ({
                                ...prev,
                                [countryCode]: !prev[countryCode],
                            }))
                        }
                        onSelectCountry={(countryCode, cities) => {
                            setSelectedCities((prev) => {
                                const currentlySelected = prev[countryCode] || [];
                                const isAllSelected = currentlySelected.length === cities.length;
                                return {
                                    ...prev,
                                    [countryCode]: isAllSelected ? [] : [...cities],
                                };
                            });
                        }}
                        onSelectCity={(countryCode, city) => {
                            setSelectedCities((prev) => {
                                const current = prev[countryCode] || [];
                                const isSelected = current.includes(city);
                                return {
                                    ...prev,
                                    [countryCode]: isSelected ? current.filter((c) => c !== city) : [...current, city],
                                };
                            });
                        }}
                    />
                )}
            </ModalTwoContent>

            <ModalTwoFooter className={`flex ${step !== STEP.NAME ? 'justify-between' : 'justify-end'}`}>
                {step !== STEP.NAME && <Button type="button" onClick={handleBack}>{c('Action').t`Back`}</Button>}
                <Button color="norm" type="button" onClick={handleNext}>
                    {step === STEP.COUNTRIES ? c('Action').t`Save` : c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SharedServersModal;
