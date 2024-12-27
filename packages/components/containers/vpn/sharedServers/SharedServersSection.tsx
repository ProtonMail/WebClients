import React, { useMemo } from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import { MINUTE } from '@proton/shared/lib/constants';

import EmptyViewContainer from '../../../containers/app/EmptyViewContainer';
import { useSharedServers } from './useSharedServers';

interface SharedServersSectionProps {
    maxAge?: number; // Time in ms to refresh data periodically
}

const SharedServersSection = ({ maxAge = 10 * MINUTE }: SharedServersSectionProps) => {
    const { loading, locations, refresh } = useSharedServers(maxAge);

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

    return (
        <div className="p-4 bg-white border rounded-md shadow">
            <h2 className="text-lg font-bold mb-4">{c('Info').t`Shared Server Location Filters`}</h2>
            <Table className="my-2" responsive="cards">
                <thead>
                    <tr>
                        <TableCell key="country" type="header">{c('Header').t`Country`}</TableCell>
                        <TableCell key="city" type="header">{c('Header').t`City`}</TableCell>
                    </tr>
                </thead>
                <TableBody>
                    {sortedLocations.map((location) => (
                        <tr key={`${location.Country}-${location.City}`}>
                            <TableCell>{location.Country}</TableCell>
                            <TableCell>{location.City}</TableCell>
                        </tr>
                    ))}
                </TableBody>
            </Table>
            <div className="mt-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={refresh}>
                    {c('Action').t`Refresh Data`}
                </button>
            </div>
        </div>
    );
};

export default SharedServersSection;
