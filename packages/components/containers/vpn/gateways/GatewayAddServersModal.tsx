import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Loader, useApiResult, useModalTwoStatic } from '@proton/components';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { CountryOptions } from '../../../helpers/countries';
import AddServerConfirmationModal from './AddServerConfirmationModal';
import type { DeletedDedicatedIp } from './DeletedDedicatedIp';
import { GatewayCountrySelection } from './GatewayCountrySelection';
import type { GatewayDto } from './GatewayDto';
import type { GatewayLocation } from './GatewayLocation';
import type { GatewayUser } from './GatewayUser';
import { queryDeletedDedicatedIPs } from './api';
import { getInitialModel } from './helpers';
import { useAddedQuantities, useUnassigningAddedQuantities } from './useAddedQuantities';
import { useSpecificCountryCount } from './useSpecificCountryCount';

interface Props extends ModalStateProps {
    countries: readonly string[];
    locations: readonly GatewayLocation[];
    deletedInCountries: Record<string, number>;
    ownedCount: number;
    usedCount: number;
    users: readonly GatewayUser[];
    countryOptions: CountryOptions;
    singleServer?: boolean;
    showCancelButton?: boolean;
    onSubmitDone: (quantities: Record<string, number>) => void;
    onUpsell: () => void;
}

const GatewayAddServersModal = ({
    countries,
    locations,
    deletedInCountries,
    ownedCount,
    usedCount,
    users,
    countryOptions,
    onSubmitDone,
    onUpsell,
    singleServer = false,
    showCancelButton = false,
    ...rest
}: Props) => {
    const { loading: deletedDedicatedIPsLoading, result } = useApiResult<
        { DedicatedIps: DeletedDedicatedIp[] },
        typeof queryDeletedDedicatedIPs
    >(queryDeletedDedicatedIPs, []);

    const deletedDedicatedIPs = result?.DedicatedIps;

    const [addServerConfirmationModal, showAddServerConfirmationModal] = useModalTwoStatic(AddServerConfirmationModal);
    const [model, setModel] = useState(getInitialModel(locations));
    const remainingCount = useMemo(() => ownedCount - usedCount, [ownedCount, usedCount]);
    const addedCount = useAddedQuantities(model);
    const totalAddedCount = addedCount + useUnassigningAddedQuantities(model);
    const totalCountExceeded = useMemo(
        () => addedCount > remainingCount - (deletedDedicatedIPs?.length || 0),
        [addedCount, remainingCount]
    );
    const specificCountryCount = useSpecificCountryCount(model, remainingCount, deletedInCountries);
    const needUpsell = useMemo(
        () => totalCountExceeded || specificCountryCount > 0,
        [totalCountExceeded, specificCountryCount]
    );

    const changeModel = (diff: Partial<GatewayDto>) => setModel((model) => ({ ...model, ...diff }));

    const handleSubmit = async () => {
        const quantities = {
            ...model.quantities,
        };

        Object.keys(model.unassignedIpQuantities || {}).forEach((locationId) => {
            const count = model.unassignedIpQuantities?.[locationId] || 0;

            if (count > 0) {
                quantities[locationId] = (quantities[locationId] || 0) + count;
            }
        });

        showAddServerConfirmationModal({
            onSubmitDone: () => {
                onSubmitDone(quantities);
                rest.onClose?.();
            },
            totalQuantities: quantities,
            countryOptions,
        });
    };

    return (
        <>
            <ModalTwo size="large" as={Form} onSubmit={handleSubmit} {...rest}>
                {deletedDedicatedIPsLoading ? (
                    <Loader />
                ) : (
                    <>
                        <ModalTwoHeader title={c('Title').t`Add dedicated servers`} />
                        <ModalTwoContent>
                            <GatewayCountrySelection
                                singleServer={singleServer}
                                locations={locations}
                                ownedCount={ownedCount}
                                usedCount={usedCount}
                                addedCount={addedCount}
                                deletedDedicatedIPs={deletedDedicatedIPs}
                                needUpsell={needUpsell}
                                countryOptions={countryOptions}
                                onUpsell={() => {
                                    rest.onClose?.();
                                    onUpsell();
                                }}
                                model={model}
                                changeModel={changeModel}
                            />
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            {showCancelButton ? (
                                <Button color="weak" onClick={rest.onClose}>
                                    {c('Action').t`Cancel`}
                                </Button>
                            ) : (
                                <div />
                            )}
                            {!needUpsell && totalAddedCount >= 1 ? (
                                <Button color="norm" type="submit">
                                    {c('Feature').ngettext(
                                        msgid`Add (${totalAddedCount})`,
                                        `Add (${totalAddedCount})`,
                                        totalAddedCount
                                    )}
                                </Button>
                            ) : (
                                <Button color="norm" type="submit" disabled>
                                    {c('Feature').t`Add`}
                                </Button>
                            )}
                        </ModalTwoFooter>
                    </>
                )}
            </ModalTwo>
            {addServerConfirmationModal}
        </>
    );
};

export default GatewayAddServersModal;
