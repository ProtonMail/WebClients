import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';

import { c, msgid } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
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
import clsx from '@proton/utils/clsx';

import PolicyPreviewModal from './PolicyModal/PolicyPreviewModal';
import UnpublishedChangesModal from './PolicyModal/UnpublishedChangesModal';
import PolicyEditButton from './PolicyTable/PolicyEditButton';
import PolicyUsersGroupsList from './PolicyTable/PolicyUsersGroupsList';
import SelectedCountriesButton from './PolicyTable/SelectedCountriesButton';
import type { LocalStatus, VpnLocationFilterPolicyLocal } from './constants';
import { useCustomPrompt } from './useCustomPrompt';

import './SharedServersSection.scss';

const OrangeDot = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_10876_154544)">
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
    const history = useHistory();

    const [originalPolicies, setOriginalPolicies] = useState<VpnLocationFilterPolicyLocal[]>([]);
    const [localPolicies, setLocalPolicies] = useState<VpnLocationFilterPolicyLocal[]>([]);
    const [policyType, setPolicyType] = useState<PolicyType>(PolicyType.None);
    const [previousPolicyType, setOriginalPolicyType] = useState<PolicyType>(PolicyType.None);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [didPublishChanges, setDidPublishChanges] = useState(false);
    const [createModal, showCreateModal] = useModalTwoStatic(Modal);
    const [deleteModal, showDeleteModal] = useModalTwoStatic(DeleteModal);
    const [policyPreviewModal, showPolicyPreviewModal] = useModalTwoStatic(PolicyPreviewModal);
    const [unpublishedChangesModal, showUnpublishedChangesModal] = useModalTwoStatic(UnpublishedChangesModal);

    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);
    const { sortedLocations, countriesCount } = sortLocationsByLocalizedCountryName(locations, countryOptions);

    const customPolicies = useMemo(() => {
        return localPolicies.filter((policy) => policy.Type === PolicyType.Custom);
    }, [localPolicies]);

    useCustomPrompt(hasUnsavedChanges, (path: string) => {
        showUnpublishedChangesModal({
            onDiscard: () => {
                const unblock = history.block(() => {});
                unblock();
                history.push(path);
            },
        });
    });

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
        (policyToEdit: VpnLocationFilterPolicyLocal, step: number, onSuccess?: () => void) => {
            showCreateModal({
                policy: policyToEdit,
                isEditing: true,
                soloStep: step,
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
            const anyLocalPolicyChange = localPolicies.some((p) =>
                ['created', 'edited', 'deleted'].includes(p.localStatus ?? 'unchanged')
            );
            /** On | Off | Custom */
            const typeChanged = policyType !== previousPolicyType;

            let showBar = false;

            if (anyLocalPolicyChange || typeChanged) {
                showBar = true;
            }
            setHasUnsavedChanges(showBar);
        }
    }, [loading, originalPolicies, localPolicies, policyType, previousPolicyType]);

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
                className={`publish-banner ${hasUnsavedChanges && 'unpublished'} rounded my-6 flex items-center w-full p-2 flex-nowrap gap-4`}
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
                    <div className="unpublished-cta flex items-center shrink-0">
                        <span className="text-right">
                            <OrangeDot />
                            <span className="ml-2" style={{ fontWeight: 'var(--font-weight-bold)' }}>{c('Info')
                                .t`You have unpublished changes`}</span>
                        </span>
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

                    <div className="flex flex-column mt-4 gap-2">
                        {customPolicies.map((customPolicy) => {
                            const isDeleted = customPolicy.localStatus === 'deleted';

                            const id = customPolicy.Name + customPolicy.LocationFilterPolicyID;

                            const handleOpenPreviewModal = ({ target }: React.KeyboardEvent | React.MouseEvent) => {
                                if (
                                    target instanceof HTMLElement &&
                                    (target.closest('.prevent-interaction') || target?.id !== id)
                                ) {
                                    return;
                                }

                                handleShowPolicyPreviewModal(customPolicy);
                            };

                            return (
                                <button
                                    id={id}
                                    key={id}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter') {
                                            handleOpenPreviewModal(e);
                                        }
                                    }}
                                    onClick={handleOpenPreviewModal}
                                    className={clsx(
                                        {
                                            'border border-weak color-disabled policy-row-disabled': isDeleted,
                                            'bg-weak': !isDeleted,
                                        },
                                        `flex md:items-center min-h-custom rounded-xl p-6 gap-2`
                                    )}
                                    style={{ '--min-h-custom': '76px' }}
                                    type="button"
                                >
                                    <div className="flex flex-column md:flex-row md:items-center flex-1 gap-2">
                                        <div
                                            className="flex gap-1 items-center text-lg text-semibold w-custom overflow-hidden"
                                            style={{ '--w-custom': '200px' }}
                                        >
                                            {customPolicy.Name}
                                            {customPolicy.localStatus !== 'unchanged' && <OrangeDot />}
                                        </div>
                                        <div className="md:flex-1" style={{ flexBasis: 'min-content' }}>
                                            <PolicyUsersGroupsList policy={customPolicy} />
                                        </div>
                                        <SelectedCountriesButton
                                            policy={customPolicy}
                                            sortedLocations={sortedLocations}
                                        />
                                    </div>
                                    <div className="flex gap-1 items-center justify-end">
                                        {!isDeleted && (
                                            <PolicyEditButton
                                                policy={customPolicy}
                                                handleEditPolicy={handleEditPolicy}
                                                handleDeletePolicy={handleDeletePolicy}
                                            />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {policyPreviewModal}
            {createModal}
            {deleteModal}
            {unpublishedChangesModal}
        </SettingsSectionWide>
    );
};

export default SharedServersSection;
