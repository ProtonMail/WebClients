import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import Tabs from '@proton/components/components/tabs/Tabs';

import { CountryFlagAndName } from '../../gateways/CountryFlagAndName';
import type { Location, VpnLocationFilterPolicyLocal } from '../constants';

const CountriesTable = ({ locations }: { locations: Location[] }) => (
    <Table responsive="cards" className="countries-table">
        <TableBody>
            {locations.map((location) => (
                <TableRow key={location.Country}>
                    <TableCell>
                        <CountryFlagAndName
                            countryCode={location.Country}
                            countryName={location.localizedCountryName}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const SelectedCountriesButton = ({
    policy,
    sortedLocations,
}: {
    policy: VpnLocationFilterPolicyLocal;
    sortedLocations: Location[];
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [tabIndex, setTabIndex] = useState(0);

    const isDeleted = policy.localStatus === 'deleted';
    const countriesCount = policy.Locations.reduce((acc, { Country }) => acc.add(Country), new Set()).size;
    const locationText =
        countriesCount === 0
            ? c('Info').t`No countries enabled`
            : c('Info').ngettext(
                  msgid`${countriesCount} country enabled`,
                  `${countriesCount} countries enabled`,
                  countriesCount
              );

    const policyCountries = policy.Locations.map(({ Country }) => Country);
    const enabledLocations = useMemo(
        () => sortedLocations.filter(({ Country }) => policyCountries.includes(Country)),
        [sortedLocations, policy]
    );
    const disabledLocations = useMemo(
        () => sortedLocations.filter(({ Country }) => !policyCountries.includes(Country)),
        [sortedLocations, policy]
    );

    return (
        <>
            <DropdownButton
                disabled={isDeleted}
                shape="ghost"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                hasCaret
            >
                <IcEarth className="color-weak mr-2" />
                {locationText}
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{
                    width: '20em',
                    height: '300px',
                }}
                autoClose={false}
                autoCloseOutside={false}
                className="p-4"
            >
                <Tabs
                    variant="modern"
                    fullWidth
                    value={tabIndex}
                    onChange={setTabIndex}
                    tabs={[
                        {
                            title: c('Label').t`Enabled`,
                            content: (
                                <div className="max-h-custom overflow-auto" style={{ '--max-h-custom': '240px' }}>
                                    <CountriesTable locations={enabledLocations} />
                                </div>
                            ),
                        },
                        {
                            title: c('Label').t`Disabled`,
                            content: (
                                <div className="max-h-custom overflow-auto" style={{ '--max-h-custom': '240px' }}>
                                    <CountriesTable locations={disabledLocations} />
                                </div>
                            ),
                        },
                    ]}
                />
            </Dropdown>
        </>
    );
};

export default SelectedCountriesButton;
