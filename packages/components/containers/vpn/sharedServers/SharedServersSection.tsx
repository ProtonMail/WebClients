import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { PolicyType } from '@proton/components/containers/vpn/sharedServers/constants';

// import EmptyViewContainer from '../../../containers/app/EmptyViewContainer';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import SharedServersModal from './SharedServersModal';
import SharedServersTypeButton from './SharedServersTypeButton';
import { useSharedServers } from './useSharedServers';

const SharedServersSection = ({ maxAge = 10 * 60 * 1000 }) => {
    const { loading, policies, refresh } = useSharedServers(maxAge);
    const [policyType, setPolicyType] = useState(2); // Default to Custom
    const [createModal, showCreateModal] = useModalTwoStatic(SharedServersModal);

    const addPolicy = () => showCreateModal({});

    if (loading) {
        return <Loader />;
    }

    // Remove all and none policies, to avoid showing them on custom policies
    const customPolicies = policies.filter((policy) => {
        return policy.Type === PolicyType.Custom;
    });

    // TODO: enable this later
    // if (!policies?.length) {
    //     return (
    //         <EmptyViewContainer>
    //             <h3>{c('Info').t`No Shared Server Policies Found`}</h3>
    //             <p>{c('Info').t`No policies have been created yet.`}</p>
    //         </EmptyViewContainer>
    //     );
    // }
    const amountUsers = 55; // TODO
    const totalUsers = 55; // TODO

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info').t`Allow users to connect to secure shared servers based on defined policies.`}
            </SettingsParagraph>

            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full mt-8">
                <SharedServersTypeButton
                    label={c('Info').t`On`}
                    onClick={() => setPolicyType(1)}
                    isSelected={policyType === 1}
                    description={c('Description').t`Everyone in your organization can connect to shared servers.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Off`}
                    onClick={() => setPolicyType(0)}
                    isSelected={policyType === 0}
                    description={c('Description').t`No one in your organization can connect to shared servers.`}
                />
                <SharedServersTypeButton
                    label={c('Info').t`Custom`}
                    onClick={() => setPolicyType(2)}
                    isSelected={policyType === 2}
                    description={c('Description').t`Create policies to manage access to shared servers.`}
                />
            </div>

            {policyType === 2 && (
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
                                            onClick={() => showCreateModal({ policy: customPolicy })}
                                        >
                                            {c('Action').t`Edit`}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4">
                        <Button onClick={refresh}>{c('Action').t`Refresh data`}</Button>
                    </div>
                </>
            )}
            {createModal}
        </SettingsSectionWide>
    );
};

export default SharedServersSection;
