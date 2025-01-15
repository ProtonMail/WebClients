import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { MINUTE, VPN_APP_NAME } from '@proton/shared/lib/constants';

import EmptyViewContainer from '../../../containers/app/EmptyViewContainer';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import SharedServersTypeButton from './SharedServersTypeButton';
import { useSharedServers } from './useSharedServers';

interface SharedServersSectionProps {
    maxAge?: number; // Time in ms to refresh data periodically
}

export enum PolicyType {
    None = 0,
    All = 1,
    Custom = 2,
}

const SharedServersSection = ({ maxAge = 10 * MINUTE }: SharedServersSectionProps) => {
    const { loading, locations, refresh } = useSharedServers(maxAge);
    const [policyType, setPolicyType] = useState<PolicyType>(PolicyType.None);

    const sortedLocations = useMemo(() => {
        return [...(locations || [])].sort((a, b) => a.Country.localeCompare(b.Country));
    }, [locations]);

    if (loading) {
        return <Loader />;
    }

    if (!locations?.length) {
        return (
            <EmptyViewContainer>
                <h3>{c('Info').t`No Shared Servers Found`}</h3>
                <p>{c('Info').t`No location filters are currently assigned.`}</p>
            </EmptyViewContainer>
        );
    }
    const amountUsers = 55; // TODO
    const totalUsers = 55; // TODO

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {getBoldFormattedText(
                    c('Info')
                        .t`Allow users to connect to secure shared servers from the **Countries** section of the ${VPN_APP_NAME} app.`
                )}
                <Href href={''} className="ml-1">{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>

            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full mt-8">
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
            {policyType !== PolicyType.None && (
                <>
                    <div className="flex mt-8 w-full justify-between items-center">
                        {/* Left: Custom Policies Section */}
                        <div className="flex-1 mr-4">
                            <p className="text-semibold text-lg m-0">Custom policies</p>
                            <p className="m-0 color-weak">
                                {c('Info').ngettext(
                                    msgid`${amountUsers}/${totalUsers} users currently have access to shared servers.`,
                                    `${amountUsers}/${totalUsers} users currently have access to shared servers.`,
                                    totalUsers
                                )}
                            </p>
                        </div>

                        {/* Right: Create New Policy Button */}
                        {policyType === PolicyType.Custom && (
                            <Button
                                size="medium"
                                color="norm"
                                shape="solid"
                                className="shrink-0 inline-flex flex-nowrap items-center"
                            >
                                <Icon name="plus" className="mr-2" />
                                {c('Action').t`Create new policy`}
                            </Button>
                        )}
                    </div>
                    <div className="mt-8 p-4 border rounded">
                        <h2 className="text-lg">{c('Info').t`Shared Server Location Filters`}</h2>
                        <Table className="my-2" responsive="cards">
                            <TableHeader>
                                <TableHeaderCell key="country">{c('Header').t`Country`}</TableHeaderCell>
                                <TableHeaderCell key="city">{c('Header').t`City`}</TableHeaderCell>
                            </TableHeader>
                            <TableBody>
                                {sortedLocations.map((location) => (
                                    <TableRow>
                                        <TableCell>{location.Country}</TableCell>
                                        <TableCell>{location.City}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4">
                            <Button onClick={refresh}>{c('Action').t`Refresh data`}</Button>
                        </div>
                    </div>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default SharedServersSection;
