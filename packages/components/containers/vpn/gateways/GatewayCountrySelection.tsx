import type { ChangeEvent } from 'react';
import { useRef } from 'react';

import { c, msgid } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useNow } from '@proton/components/hooks/useNow';
import { type CountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { SECOND } from '@proton/shared/lib/constants';

import { ButtonNumberInput } from './ButtonNumberInput';
import { CountryFlagAndName } from './CountryFlagAndName';
import type { DeletedDedicatedIp } from './DeletedDedicatedIp';
import type { GatewayDto } from './GatewayDto';
import type { GatewayLocation } from './GatewayLocation';
import { getLocationDisplayName, getLocationFromId, getLocationId } from './helpers';

interface Props {
    singleServer: boolean;
    locations: readonly GatewayLocation[];
    ownedCount: number;
    usedCount: number;
    addedCount: number;
    deletedDedicatedIPs?: DeletedDedicatedIp[];
    countryOptions: CountryOptions;
    loading?: boolean;
    model: GatewayDto;
    onUpdateCheckedLocations: (checkedLocations: GatewayLocation[]) => void;
    changeModel: (diff: Partial<GatewayDto>) => void;
}

export const GatewayCountrySelection = ({
    singleServer,
    locations,
    ownedCount,
    usedCount,
    addedCount,
    deletedDedicatedIPs,
    countryOptions,
    loading = false,
    model,
    onUpdateCheckedLocations,
    changeModel,
}: Props) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isTrial = useIsB2BTrial(subscription, organization);

    const recentlyUsedServersRef = useRef<GatewayLocation[]>([]);
    const remainingCount = ownedCount - usedCount;
    const availableCount = Math.max(0, remainingCount - addedCount - (deletedDedicatedIPs?.length || 0));
    const unassignedAvailableCount = deletedDedicatedIPs?.length || 0;
    const totalCountExceeded = addedCount >= remainingCount - (deletedDedicatedIPs?.length || 0);
    const now = useNow(10 * SECOND);

    const handleUnassigningLocationChange = ({ value }: SelectChangeEvent<string>) =>
        changeModel({ location: getLocationFromId(value) });

    const handleUnassigningLocationChecked = (event: ChangeEvent<HTMLInputElement>, location: GatewayLocation) => {
        const unassignedIpQuantities = {
            ...model.unassignedIpQuantities,
        };

        const locationId = getLocationId(location);

        if (!unassignedIpQuantities[locationId]) {
            unassignedIpQuantities[locationId] = 0;
        }

        unassignedIpQuantities[locationId] += event.target.checked ? 1 : -1;

        const mainLocation = getLocationFromId(
            Object.keys(unassignedIpQuantities).reduce((previous, locationId) =>
                (unassignedIpQuantities[locationId] || 0) > (unassignedIpQuantities[previous] || 0)
                    ? locationId
                    : previous
            )
        );

        if (mainLocation !== model.location) {
            changeModel({ location: mainLocation });
        }

        const locationString = JSON.stringify(location);
        if (event.target.checked) {
            // Add/store location if it's not already present
            if (!recentlyUsedServersRef.current.some((ip: GatewayLocation) => JSON.stringify(ip) === locationString)) {
                recentlyUsedServersRef.current = [...recentlyUsedServersRef.current, location];
            }
        } else {
            // Remove location if unchecked
            recentlyUsedServersRef.current = recentlyUsedServersRef.current.filter(
                (ip: GatewayLocation) => JSON.stringify(ip) !== locationString
            );
        }

        onUpdateCheckedLocations(recentlyUsedServersRef.current);

        return changeModel({ unassignedIpQuantities });
    };

    const handleQuantityChange = (newQuantity: number, locationId: string) => {
        const quantities = {
            ...model.quantities,
            [locationId]: newQuantity,
        };

        const mainLocation = getLocationFromId(
            Object.keys(quantities).reduce((previous, locationId) =>
                (quantities[locationId] || 0) > (quantities[previous] || 0) ? locationId : previous
            )
        );

        if (mainLocation !== model.location) {
            changeModel({ location: mainLocation });
        }

        if (newQuantity === 0) {
            delete quantities[locationId];
        }

        changeModel({ quantities });
    };

    // Helper function to check if a location from recently used servers is already checked
    const isLocationChecked = (location: GatewayLocation) => {
        return model?.checkedLocations?.some((ip) => JSON.stringify(ip) === JSON.stringify(location));
    };

    return singleServer ? (
        <Row>
            <Label htmlFor="domain">{c('Label').t`Country`}</Label>
            <Field>
                <SelectTwo value={getLocationId(model.location)} onChange={handleUnassigningLocationChange}>
                    {locations.map((location) => {
                        const country = getLocalizedCountryByAbbr(location.Country, countryOptions) || location.Country;
                        const title = getLocationDisplayName(location, countryOptions);
                        return (
                            <Option key={getLocationId(location)} value={title} title={title}>
                                <CountryFlagAndName countryCode={location.Country} countryName={country} />
                            </Option>
                        );
                    })}
                </SelectTwo>
            </Field>
        </Row>
    ) : (
        <>
            {unassignedAvailableCount !== 0 && (
                <div>
                    <h4 className="text-bold mb-1" style={{ marginTop: 0 }}>
                        {c('Info').t`Select recently used servers`}{' '}
                        <Info
                            className="ml-1"
                            title={
                                <>
                                    <b>{c('Info').t`Recently used servers:`}</b>{' '}
                                    {c('Info')
                                        .t`When you remove a server from a Gateway, it enters a 10-day deactivation period. This server can be added to a new Gateway, but its country cannot be changed.`}
                                </>
                            }
                        />
                    </h4>
                    <p className="mb-5 color-weak" style={{ marginTop: 0 }}>
                        {c('Info').ngettext(
                            msgid`You have ${unassignedAvailableCount} recently used servers available. To allocate these servers to another country, you'll have to wait until deactivation is complete.`,
                            `You have ${unassignedAvailableCount} recently used servers available. To allocate these servers to another country, you'll have to wait until deactivation is complete.`,
                            unassignedAvailableCount
                        )}
                    </p>
                    {deletedDedicatedIPs?.map((deletedDedicatedIp) => {
                        const availableAgainAfterSeconds =
                            deletedDedicatedIp.AvailableAgainAfter - now.getTime() / 1000;
                        const availableAgainAfterHours = Math.ceil(availableAgainAfterSeconds / 3600);
                        const availableAgainAfterDays = Math.ceil(availableAgainAfterSeconds / 3600 / 24);
                        return (
                            <div>
                                <Label>
                                    <Checkbox
                                        checked={isLocationChecked(deletedDedicatedIp.Location)}
                                        onChange={(e) =>
                                            handleUnassigningLocationChecked(e, deletedDedicatedIp.Location)
                                        }
                                    />{' '}
                                    <CountryFlagAndName
                                        countryCode={deletedDedicatedIp.Location.Country}
                                        countryName={getLocationDisplayName(
                                            deletedDedicatedIp.Location,
                                            countryOptions
                                        )}
                                    />
                                    <p
                                        className="color-weak"
                                        style={{ marginLeft: '60px', marginTop: 0, marginBottom: 0, fontSize: '0.9em' }}
                                    >
                                        {availableAgainAfterDays > 1
                                            ? c('Info').ngettext(
                                                  msgid`or assign to any country in ${availableAgainAfterDays} day`,
                                                  `or assign to any country in ${availableAgainAfterDays} days`,
                                                  availableAgainAfterDays
                                              )
                                            : c('Info').ngettext(
                                                  msgid`or assign to any country in ${availableAgainAfterHours} hour`,
                                                  `or assign to any country in ${availableAgainAfterHours} hours`,
                                                  availableAgainAfterHours
                                              )}
                                    </p>
                                </Label>
                            </div>
                        );
                    })}
                </div>
            )}
            <div>
                <h4 className="text-bold mb-1">Add new servers</h4>
                <p
                    className="mb-5 color-weak"
                    style={{ marginTop: 0, color: totalCountExceeded ? 'var(--signal-danger)' : '' }}
                >
                    {c('Info').ngettext(
                        msgid`You have ${availableCount} new server available.`,
                        `You have ${availableCount} new servers available.`,
                        availableCount
                    )}
                </p>
                {!isTrial && (
                    <div className="flex flex-nowrap mb-4 rounded p-2 bg-weak">
                        <Icon name="info-circle" className="shrink-0" />
                        <div className="ml-2">
                            {c('Info')
                                .t`We recommend having multiple servers in different locations to provide redundancy.`}
                        </div>
                    </div>
                )}
                <p></p>
                {locations.map((location) => {
                    const locationId = getLocationId(location);
                    return (
                        <div key={locationId} className="flex *:min-size-auto md:flex-nowrap items-center mb-1">
                            <ButtonNumberInput
                                id={locationId}
                                value={model.quantities?.[locationId]}
                                min={0}
                                max={99}
                                disabled={
                                    loading ||
                                    (totalCountExceeded &&
                                        model.quantities !== undefined &&
                                        !(locationId in model.quantities))
                                }
                                onChange={(newQuantity: number) => handleQuantityChange(newQuantity, locationId)}
                                step={1}
                                location={location}
                                countryOptions={countryOptions}
                                ownedCount={ownedCount}
                                usedCount={usedCount}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-nowrap mb-4 rounded p-2 bg-weak">
                <Icon name="info-circle" className="shrink-0" />
                <div className="ml-2">
                    {c('Info').ngettext(
                        msgid`Your free trial includes ${ownedCount} dedicated server.`,
                        `Your free trial includes ${ownedCount} dedicated servers.`,
                        ownedCount
                    )}
                </div>
            </div>
        </>
    );
};

export default GatewayCountrySelection;
