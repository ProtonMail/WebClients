import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { IcEarth } from '@proton/icons/icons/IcEarth';

import Dropdown from '../../../../components/dropdown/Dropdown';
import DropdownButton from '../../../../components/dropdown/DropdownButton';
import Table from '../../../../components/table/Table';
import TableBody from '../../../../components/table/TableBody';
import TableCell from '../../../../components/table/TableCell';
import TableRow from '../../../../components/table/TableRow';
import Tabs from '../../../../components/tabs/Tabs';
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
