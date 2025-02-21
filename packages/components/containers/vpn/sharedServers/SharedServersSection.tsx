import React, { useCallback, useMemo, useState } from 'react';

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
import { CountryFlagAndName } from '@proton/components/containers/vpn/gateways/CountryFlagAndName';
import DeleteModal from '@proton/components/containers/vpn/sharedServers/PolicyModal/DeleteModal';
import { PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';
import { sortLocationsByLocalizedCountryName } from '@proton/components/containers/vpn/sharedServers/sortLocationsByLocalizedCountryName';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getCountryOptions } from '@proton/payments';
import { MINUTE, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import SettingsSectionWide from '../../account/SettingsSectionWide';
import Modal from './PolicyModal/Modal';
import SharedServersTypeButton from './SharedServersTypeButton';
import { useSharedServers } from './useSharedServers';

const SharedServersSection = ({ maxAge = 10 * MINUTE }) => {
    const { loading, locations, policies, refresh } = useSharedServers(maxAge);
    const [policyType, setPolicyType] = useState<PolicyType>(PolicyType.None);
    const customPolicies = useMemo(() => policies.filter((policy) => policy.Type === PolicyType.Custom), [policies]);
    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);
    const [createModal, showCreateModal] = useModalTwoStatic(Modal);
    const [deleteModal, showDeleteModal] = useModalTwoStatic(DeleteModal);
    const { sortedLocations, countriesCount } = sortLocationsByLocalizedCountryName(locations, countryOptions);

    const addPolicy = useCallback(() => {
        showCreateModal({ onSuccess: refresh });
    }, [showCreateModal, refresh]);

    if (loading) {
        return <Loader />;
    }

    const amountUsers = 55; // TODO
    const totalUsers = 55; // TODO

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

            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full mt-4">
                <SharedServersTypeButton
                    label={c('Info').t`On`}
                    onClick={() => setPolicyType(PolicyType.All)}
                    isSelected={policyType === PolicyType.All}
                    description={c('Description')
                        .t`Everyone in your organization can connect to shared servers in all countries.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Off`}
                    onClick={() => setPolicyType(PolicyType.None)}
                    isSelected={policyType === PolicyType.None}
                    description={c('Description').t`No one in your organization can connect to shared servers.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Custom`}
                    onClick={() => setPolicyType(PolicyType.Custom)}
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
                            <p className="m-0 color-weak">
                                {c('Info').ngettext(
                                    msgid`${amountUsers}/${totalUsers} users currently have access to shared servers.`,
                                    `${amountUsers}/${totalUsers} users currently have access to shared servers.`,
                                    totalUsers
                                )}
                            </p>
                        </div>

                        <Button size="medium" color="norm" shape="solid" onClick={addPolicy}>
                            <Icon name="plus" className="mr-2" />
                            {c('Action').t`Create new policy`}
                        </Button>
                    </div>

                    <Table className="mt-4" responsive="cards">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>{c('Header').t`Policy Name`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Groups`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Enabled Countries`}</TableHeaderCell>
                                <TableHeaderCell>{c('Header').t`Actions`}</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customPolicies.map((customPolicy) => (
                                <TableRow key={customPolicy.LocationFilterPolicyID}>
                                    <TableCell>{customPolicy.Name}</TableCell>
                                    <TableCell>{customPolicy.Groups.map((g) => g.Name).join(', ')}</TableCell>
                                    <TableCell>
                                        {customPolicy.Locations.length} {c('Info').t`countries enabled`}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            color="norm"
                                            onClick={() => showCreateModal({ policy: customPolicy, isEditing: true })}
                                        >
                                            {c('Action').t`Edit`}
                                        </Button>
                                        <Button
                                            size="small"
                                            color="norm"
                                            onClick={() =>
                                                showDeleteModal({ onSuccess: refresh, policy: customPolicy })
                                            }
                                        >
                                            {c('Action').t`Delete`}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}

            {createModal}
            {deleteModal}
        </SettingsSectionWide>
    );
};

export default SharedServersSection;
