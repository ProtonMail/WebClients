import React, { useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button, CircleLoader } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useSharedServers, {
    type VpnLocationFilterPolicy,
} from '@proton/components/containers/vpn/sharedServers/useSharedServers';
import { getCountryOptions } from '@proton/payments';
import { MINUTE } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { CountryFlagAndName } from '../../gateways/CountryFlagAndName';
import EditPolicyDropdownMenu from '../EditPolicyDropdownMenu';
import { buildSelectedCitiesFromLocations } from '../buildSelectedCitiesFromLocations';
import { type GroupedLocation, getGroupedLocations } from './getGroupedLocations';

interface SharedServersModalProps extends ModalProps {
    policy: VpnLocationFilterPolicy;
    handleEditPolicy: (policy: VpnLocationFilterPolicy, step: number, onSuccess?: () => void) => void;
    handleDeletePolicy: (policy: VpnLocationFilterPolicy, onSuccess?: () => void) => void;
    onSuccess: (policy: VpnLocationFilterPolicy) => void;
}

const EntityRow = ({
    avatar,
    name,
    description,
}: {
    avatar: React.ReactNode;
    name: string;
    description: React.ReactNode;
}) => (
    <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full mt-2 mb-2">
        <span
            className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
            aria-hidden="true"
        >
            <span className="m-auto">{avatar}</span>
        </span>
        <div className="flex flex-column">
            <span>{name}</span>
            <span className="text-sm color-weak">{description}</span>
        </div>
    </div>
);

const PolicyPreviewModal = ({
    policy,
    handleEditPolicy,
    handleDeletePolicy,
    onSuccess,
    ...rest
}: SharedServersModalProps) => {
    const [policyName, setPolicyName] = useState('');
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [selectedCities, setSelectedCities] = useState<Record<string, string[]>>({});
    const { locations, translations, loading } = useSharedServers(10 * MINUTE);
    const [userSettings] = useUserSettings();
    const countryOptions = getCountryOptions(userSettings);

    const isGroupBasedPolicy = policy.Groups.length > 0;

    const groupedLocations = useMemo(
        () => getGroupedLocations(locations, countryOptions, translations.cities),
        [locations, countryOptions]
    );

    useEffect(() => {
        if (!policy) {
            return;
        }
        setPolicyName(policy.Name ?? '');

        const map = buildSelectedCitiesFromLocations(policy.Locations || []);
        setSelectedCities(map);
    }, [policy]);

    const selectedGroupedLocations = groupedLocations.filter((gl: GroupedLocation) =>
        Object.keys(selectedCities).includes(gl.country)
    );
    const notSelectedGroupedLocations = groupedLocations.filter(
        (gl: GroupedLocation) => !Object.keys(selectedCities).includes(gl.country)
    );

    return (
        <ModalTwo size="xlarge" as={Form} {...rest}>
            <ModalTwoHeader
                title={policyName}
                actions={
                    <Button
                        color="weak"
                        shape="solid"
                        ref={anchorRef}
                        onClick={() => {
                            toggle();
                        }}
                    >
                        <Icon name="pencil" size={4} /> {c('Action').t`Edit`}
                    </Button>
                }
            />
            <ModalTwoContent>
                <div className="flex items-start justify-start flex-nowrap w-full h-full">
                    <div
                        className="w-custom max-w-custom h-full shrink-0 bg-norm border-norm m-2"
                        style={{ '--w-custom': '31.5%', '--max-w-custom': '30rem' }}
                    >
                        <p className="border-bottom text-semibold p-2">
                            {isGroupBasedPolicy ? c('Info').t`Groups` : c('Info').t`Users`} (
                            {isGroupBasedPolicy ? policy.Groups.length : policy.Users.length})
                        </p>

                        {isGroupBasedPolicy &&
                            policy.Groups.map((group) => (
                                <EntityRow
                                    key={group.GroupID}
                                    avatar={<Icon name="users-filled"></Icon>}
                                    name={group.Name}
                                    description={c('Label').ngettext(
                                        msgid`${group.UserCount} user`,
                                        `${group.UserCount} users`,
                                        group.UserCount
                                    )}
                                />
                            ))}

                        {!isGroupBasedPolicy &&
                            policy.Users.map((user) => (
                                <EntityRow
                                    key={user.UserID}
                                    avatar={getInitials(user.Name || '')}
                                    name={user.Name}
                                    description={user.Email}
                                />
                            ))}
                    </div>
                    <div
                        className="w-custom max-w-custom h-full shrink-0 bg-norm border-norm m-2"
                        style={{ '--w-custom': '31.5%', '--max-w-custom': '30rem' }}
                    >
                        <p className="border-bottom text-semibold p-2">
                            <Icon name="checkmark-circle-filled" size={4} color="var(--signal-success)" />{' '}
                            {c('Info').t`Enabled countries`} ({selectedGroupedLocations.length})
                        </p>

                        {loading && (
                            <div className="flex flex-nowrap">
                                <CircleLoader />
                            </div>
                        )}
                        {selectedGroupedLocations.map((gl) => (
                            <div className="mb-4">
                                <CountryFlagAndName countryCode={gl.country} countryName={gl.localizedCountryName} />
                            </div>
                        ))}
                    </div>
                    <div
                        className="w-custom max-w-custom h-full shrink-0 bg-norm border-norm m-2"
                        style={{ '--w-custom': '31.5%', '--max-w-custom': '30rem' }}
                    >
                        <p className="border-bottom text-semibold p-2">
                            <Icon name="circle-slash" size={4} color="var(--signal-danger)" />{' '}
                            {c('Info').t`Disabled countries`} ({notSelectedGroupedLocations.length})
                        </p>

                        {loading && (
                            <div className="flex flex-nowrap">
                                <CircleLoader />
                            </div>
                        )}
                        {notSelectedGroupedLocations.map((gl) => (
                            <div className="mb-4 opacity-50">
                                <CountryFlagAndName countryCode={gl.country} countryName={gl.localizedCountryName} />
                            </div>
                        ))}
                    </div>
                </div>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button color="norm" type="button" onClick={rest.onClose}>{c('Info').t`Got it`}</Button>
            </ModalTwoFooter>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
                <EditPolicyDropdownMenu
                    policy={policy}
                    handleEditPolicy={handleEditPolicy}
                    handleDeletePolicy={handleDeletePolicy}
                    onClose={rest.onClose}
                />
            </Dropdown>
        </ModalTwo>
    );
};

export default PolicyPreviewModal;
