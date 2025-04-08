import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Prompt } from 'react-router';

import { c, msgid } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';
import DeleteModal from '@proton/components/containers/vpn/sharedServers/PolicyModal/DeleteModal';
import Modal from '@proton/components/containers/vpn/sharedServers/PolicyModal/Modal';
import SharedServersTypeButton from '@proton/components/containers/vpn/sharedServers/SharedServersTypeButton';
import type {
    CreateLocationFilterPayload,
    FilterPolicyRequest,
} from '@proton/components/containers/vpn/sharedServers/api';
import { createLocationFilter } from '@proton/components/containers/vpn/sharedServers/api';
import type { LocalStatus } from '@proton/components/containers/vpn/sharedServers/constants';
import { PolicyState, PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import { mapPoliciesToFilterRequest } from '@proton/components/containers/vpn/sharedServers/mapPoliciesToFilterRequest';
import { sortLocationsByLocalizedCountryName } from '@proton/components/containers/vpn/sharedServers/sortLocationsByLocalizedCountryName';
import type { VpnLocationFilterPolicy } from '@proton/components/containers/vpn/sharedServers/useSharedServers';
import { useSharedServers } from '@proton/components/containers/vpn/sharedServers/useSharedServers';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getCountryOptions } from '@proton/payments';
import { MINUTE, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import PolicyPreviewModal from './PolicyModal/PolicyPreviewModal';
import { POLICY_STEP } from './PolicyModal/modalPolicyStepEnum';

import './SharedServersSection.scss';

interface VpnLocationFilterPolicyLocal extends VpnLocationFilterPolicy {
    localStatus?: LocalStatus;
}

const OrangeDot: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_10876_154544)">
            <circle cx="8" cy="8" r="4" fill="#FF9900" />
            <circle opacity="0.4" cx="8" cy="8" r="8" fill="#FF9900" />
        </g>
        <defs>
            <clipPath id="clip0_10876_154544">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const SharedServersSection = ({ maxAge = 10 * MINUTE }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { loading, locations, policies, refresh, users, countUsersNotInAnyPolicy } = useSharedServers(maxAge);

    const [originalPolicies, setOriginalPolicies] = useState<VpnLocationFilterPolicyLocal[]>([]);
    const [localPolicies, setLocalPolicies] = useState<VpnLocationFilterPolicyLocal[]>([]);
    const [policyType, setPolicyType] = useState<PolicyType>(PolicyType.None);
    const [originalPolicyType, setOriginalPolicyType] = useState<PolicyType>(PolicyType.None);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [didPublishChanges, setDidPublishChanges] = useState(false);
    const [createModal, showCreateModal] = useModalTwoStatic(Modal);
    const [deleteModal, showDeleteModal] = useModalTwoStatic(DeleteModal);
    const [policyPreviewModal, showPolicyPreviewModal] = useModalTwoStatic(PolicyPreviewModal);

    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);
    const { sortedLocations, countriesCount } = sortLocationsByLocalizedCountryName(locations, countryOptions);

    const customPolicies = useMemo(() => {
        return localPolicies.filter((policy) => policy.Type === PolicyType.Custom);
    }, [localPolicies]);

    const addPolicy = useCallback(() => {
        showCreateModal({
            onSuccess: (newPolicy: VpnLocationFilterPolicy) => {
                setLocalPolicies((currentPolicies) => [
                    ...currentPolicies,
                    {
                        ...newPolicy,
                        localStatus: 'created',
                    },
                ]);
            },
        });
    }, [showCreateModal]);

    const handleEditPolicy = useCallback(
        (policyToEdit: VpnLocationFilterPolicyLocal, initialStep: number, onSuccess?: () => void) => {
            showCreateModal({
                policy: policyToEdit,
                isEditing: true,
                initialStep: initialStep,
                onSuccess: (updatedPolicy: VpnLocationFilterPolicy) => {
                    setLocalPolicies((currentPolicies) =>
                        currentPolicies.map((p) =>
                            p.LocationFilterPolicyID === updatedPolicy.LocationFilterPolicyID
                                ? {
                                      ...updatedPolicy,
                                      localStatus: p.localStatus === 'created' ? 'created' : 'edited',
                                  }
                                : p
                        )
                    );

                    onSuccess?.();
                },
            });
        },
        [showCreateModal]
    );

    const handleDeletePolicy = useCallback(
        (policyToDelete: VpnLocationFilterPolicyLocal, onSuccess?: () => void) => {
            showDeleteModal({
                policy: policyToDelete,
                onSuccess: (deletedPolicy: VpnLocationFilterPolicy) => {
                    setLocalPolicies((currentPolicies) =>
                        currentPolicies.map((p) =>
                            p.LocationFilterPolicyID === deletedPolicy.LocationFilterPolicyID
                                ? { ...p, localStatus: 'deleted' }
                                : p
                        )
                    );

                    onSuccess?.();
                },
            });
        },
        [showDeleteModal]
    );

    const handleShowPolicyPreviewModal = useCallback(
        (policy: VpnLocationFilterPolicyLocal) => {
            showPolicyPreviewModal({
                policy: policy,
                handleDeletePolicy: handleDeletePolicy,
                handleEditPolicy: handleEditPolicy,
                onSuccess: () => {},
            });
        },
        [showPolicyPreviewModal]
    );

    const handlePublishChanges = useCallback(async () => {
        try {
            const finalPolicies = localPolicies.filter((p) => p.localStatus !== 'deleted');

            const FilterPoliciesInput: FilterPolicyRequest[] = mapPoliciesToFilterRequest(finalPolicies);
            const payload: CreateLocationFilterPayload = { FilterPoliciesInput };

            await api(createLocationFilter(payload));
            createNotification({
                text: c('Success')
                    .t`Changes published. Your changes will be visible to all users in the next few hours.`,
                type: 'success',
            });

            await refresh();
            setDidPublishChanges(true);
        } catch (error) {
            createNotification({
                text: c('Error').t`Error publishing changes.`,
                type: 'error',
            });
        }
    }, [api, localPolicies, createNotification, refresh]);

    const handleClickPolicyType = useCallback(
        (nextType: PolicyType) => {
            if (nextType === policyType) {
                return;
            }
            setPolicyType(nextType);

            setLocalPolicies((current) =>
                current.map((p) =>
                    p.Type === nextType ? { ...p, State: PolicyState.Active } : { ...p, State: PolicyState.Inactive }
                )
            );
        },
        [policyType]
    );

    useEffect(() => {
        if (loading) {
            return;
        }
        const firstLoad = localPolicies.length === 0 && originalPolicies.length === 0;
        if (didPublishChanges || firstLoad) {
            const updated = policies.map((p) => ({ ...p, localStatus: 'unchanged' as LocalStatus }));
            setLocalPolicies(updated);
            setOriginalPolicies(updated);

            const activePolicy = policies.find((p) => p.State === PolicyState.Active);
            const newPolicyType = activePolicy ? activePolicy.Type : PolicyType.None;

            setPolicyType(newPolicyType);
            setOriginalPolicyType(newPolicyType);
            setDidPublishChanges(false);
        }
    }, [loading, policies, didPublishChanges, localPolicies.length, originalPolicies.length]);

    useEffect(() => {
        if (!loading && originalPolicies.length > 0) {
            const anyLocalChange = localPolicies.some((p) =>
                ['created', 'edited', 'deleted'].includes(p.localStatus ?? 'unchanged')
            );
            const typeChanged = policyType !== originalPolicyType;

            let showBar = false;

            if (anyLocalChange) {
                showBar = true;
            } else if (typeChanged) {
                const switchingToCustomNoChanges =
                    policyType === PolicyType.Custom &&
                    (originalPolicyType === PolicyType.None || originalPolicyType === PolicyType.All);

                if (!switchingToCustomNoChanges) {
                    showBar = true;
                }
            }

            setHasUnsavedChanges(showBar);
        }
    }, [loading, originalPolicies, localPolicies, policyType, originalPolicyType]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    if (loading) {
        return <Loader />;
    }

    const amountUsers = {
        [PolicyType.None]: 0,
        [PolicyType.All]: users.length,
        [PolicyType.Custom]: users.length - countUsersNotInAnyPolicy,
    }[policyType];
    const totalUsers = users.length;

    return (
        <SettingsSectionWide>
            <Prompt when={hasUnsavedChanges} message={() => 'The unpublished changes you made will be lost.'} />
            <div className="flex items-center gap-1 color-weak">
                {getBoldFormattedText(
                    c('Info')
                        .t`Allow users to connect to secure shared servers from the **Countries** section of the ${VPN_APP_NAME} app.`
                )}
                <Href href={getKnowledgeBaseUrl('/shared-servers')} className="ml-1">
                    {c('Link').t`Learn more`}
                </Href>
            </div>

            <div
                className={`publishBanner ${hasUnsavedChanges && 'unpublished'} rounded my-6 flex items-center w-full p-2`}
            >
                <p className="ml-4 m-0 color-weak">
                    {
                        /*translator: if the sentence cannot be properly pluralized according to totalUsers, it's fine to keep it plural*/
                        c('Info').ngettext(
                            msgid`${amountUsers}/${totalUsers} users currently has access to shared servers.`,
                            `${amountUsers}/${totalUsers} users currently have access to shared servers.`,
                            totalUsers
                        )
                    }
                </p>
                {hasUnsavedChanges && (
                    <div className="flex items-center">
                        <OrangeDot />
                        <span className="ml-2" style={{ fontWeight: 'var(--font-weight-bold)' }}>{c('Info')
                            .t`You have unpublished changes`}</span>
                        <Button color="norm" type="button" className="ml-8" onClick={handlePublishChanges}>
                            {c('Action').t`Publish changes`}
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full mt-4">
                <SharedServersTypeButton
                    label={c('Info').t`On`}
                    onClick={() => handleClickPolicyType(PolicyType.All)}
                    isSelected={policyType === PolicyType.All}
                    description={c('Description')
                        .t`Everyone in your organization can connect to shared servers in all countries.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Off`}
                    onClick={() => handleClickPolicyType(PolicyType.None)}
                    isSelected={policyType === PolicyType.None}
                    description={c('Description').t`No one in your organization can connect to shared servers.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Custom`}
                    onClick={() => handleClickPolicyType(PolicyType.Custom)}
                    isSelected={policyType === PolicyType.Custom}
                    description={c('Description')
                        .t`Create policies to decide who can connect to shared servers in each country.`}
                />
            </div>

            {policyType === PolicyType.All && (
                <div className="mt-8 p-4 border rounded">
                    <h2 className="text-lg text-semibold">
                        {c('Info').ngettext(
                            msgid`Shared server country (${countriesCount})`,
                            `Shared server countries (${countriesCount})`,
                            countriesCount
                        )}
                    </h2>
                    <Table className="my-2" responsive="cards">
                        <TableBody>
                            {sortedLocations.map((location) => (
                                <TableRow key={location.Country}>
                                    <TableCell style={{ borderBottom: 'none' }}>
                                        <CountryFlagAndName
                                            countryCode={location.Country}
                                            countryName={location.localizedCountryName}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {policyType === PolicyType.Custom && (
                <>
                    <div className="flex mt-8 w-full justify-between items-center">
                        <div className="flex-1 mr-4">
                            <p className="text-semibold text-lg m-0">{c('Info').t`Custom policies`}</p>
                        </div>

                        <Button size="medium" color="norm" shape="solid" onClick={addPolicy}>
                            <Icon name="plus" className="mr-2" />
                            {c('Action').t`Create new policy`}
                        </Button>
                    </div>

                    <Table className="mt-2" responsive="cards">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>{c('Header').t`Policy Name`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Groups`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Enabled Countries`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Status`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Actions`}</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customPolicies.map((customPolicy) => {
                                const locationsCount = customPolicy.Locations.length;
                                const locationText =
                                    locationsCount === 0
                                        ? c('Info').t`No countries enabled`
                                        : c('Info').ngettext(
                                              msgid`${locationsCount} country enabled`,
                                              `${locationsCount} countries enabled`,
                                              locationsCount
                                          );

                                return (
                                    <TableRow
                                        key={customPolicy.LocationFilterPolicyID}
                                        onClick={() => handleShowPolicyPreviewModal(customPolicy)}
                                    >
                                        <TableCell>{customPolicy.Name}</TableCell>
                                        <TableCell>{customPolicy.Groups.map((g) => g.Name).join(', ')}</TableCell>
                                        <TableCell>{locationText}</TableCell>
                                        <TableCell>
                                            {customPolicy.localStatus === 'created' &&
                                                c('Info').t`Created (not published)`}
                                            {customPolicy.localStatus === 'edited' &&
                                                c('Info').t`Edited (not published)`}
                                            {customPolicy.localStatus === 'deleted' &&
                                                c('Info').t`Deleted (not published)`}
                                            {!customPolicy.localStatus || customPolicy.localStatus === 'unchanged'
                                                ? c('Info').t`Unchanged`
                                                : null}
                                        </TableCell>
                                        <TableCell>
                                            {customPolicy.localStatus !== 'deleted' && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        color="norm"
                                                        onClick={() => handleEditPolicy(customPolicy, POLICY_STEP.NAME)}
                                                        className="mr-2"
                                                    >
                                                        {c('Action').t`Edit`}
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="norm"
                                                        onClick={() => handleDeletePolicy(customPolicy)}
                                                    >
                                                        {c('Action').t`Delete`}
                                                    </Button>
                                                </>
                                            )}
                                            {customPolicy.localStatus === 'deleted' && (
                                                <span className="opacity-50">{c('Info').t`Pending removal`}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </>
            )}

            {policyPreviewModal}
            {createModal}
            {deleteModal}
        </SettingsSectionWide>
    );
};

export default SharedServersSection;
