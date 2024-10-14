import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApiResult, useModalTwoStatic } from '@proton/components';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { Loader } from '@proton/components/index';

import type { CountryOptions } from '../../../helpers/countries';
import AddServerConfirmationModal from './AddServerConfirmationModal';
import type { DeletedDedicatedIp } from './DeletedDedicatedIp';
import { GatewayCountrySelection } from './GatewayCountrySelection';
import type { GatewayDto } from './GatewayDto';
import type { GatewayLocation } from './GatewayLocation';
import type { GatewayModel } from './GatewayModel';
import { GatewayNameField } from './GatewayNameField';
import type { GatewayUser } from './GatewayUser';
import { GatewayUserSelection } from './GatewayUserSelection';
import { queryDeletedDedicatedIPs } from './api';
import { getInitialModel } from './helpers';
import { useAddedQuantities, useUnassigningAddedQuantities } from './useAddedQuantities';
import { useSpecificCountryCount } from './useSpecificCountryCount';

interface Props extends ModalProps<typeof Form> {
    locations: readonly GatewayLocation[];
    deletedInCountries: Record<string, number>;
    ownedCount: number;
    usedCount: number;
    users: readonly GatewayUser[];
    countryOptions: CountryOptions;
    isEditing?: boolean;
    singleServer?: boolean;
    showCancelButton?: boolean;
    onSubmitDone: (server: GatewayModel) => Promise<void>;
    onUpsell: () => void;
}

enum STEP {
    NAME,
    COUNTRIES,
    MEMBERS,
}

const GatewayModal = ({
    locations,
    deletedInCountries,
    ownedCount,
    usedCount,
    users,
    countryOptions,
    onSubmitDone,
    onUpsell,
    isEditing = false,
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

    const { validator, onFormSubmit } = useFormErrors();
    const [step, setStep] = useState(STEP.NAME);
    const [model, setModel] = useState(getInitialModel(locations));
    const [loading, setLoading] = useState(false);
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
    const canContinue = useMemo(
        () => step !== STEP.COUNTRIES || !(needUpsell || (!singleServer && totalAddedCount < 1)),
        [step, needUpsell, singleServer, totalAddedCount]
    );

    const changeModel = (diff: Partial<GatewayDto>) => setModel((model: GatewayDto) => ({ ...model, ...diff }));

    const stepBack = () => {
        if (step === STEP.MEMBERS) {
            setStep(locations.length > 1 ? STEP.COUNTRIES : STEP.NAME);

            return;
        }

        if (step === STEP.COUNTRIES) {
            setStep(STEP.NAME);

            return;
        }

        rest.onClose?.();
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        if (step === STEP.NAME) {
            setStep(STEP.COUNTRIES);

            return;
        }

        const quantities: Record<string, number> = {};
        let total = 0;

        Object.keys(model.quantities || {}).forEach((locationId) => {
            const count = model.quantities?.[locationId] || 0;

            if (count > 0) {
                quantities[locationId] = count;
                total += count;
            }
        });

        Object.keys(model.unassignedIpQuantities || {}).forEach((locationId) => {
            const count = model.unassignedIpQuantities?.[locationId] || 0;

            if (count > 0) {
                quantities[locationId] = (quantities[locationId] || 0) + count;
                total += count;
            }
        });

        if (step === STEP.COUNTRIES) {
            showAddServerConfirmationModal({
                onSubmitDone: () => {
                    setStep(STEP.MEMBERS);
                },
                totalQuantities: quantities,
                countryOptions,
            });

            return;
        }

        const dtoBody: GatewayModel =
            singleServer || total === 1
                ? {
                      Name: model.name,
                      Location: model.location,
                      Features: model.features,
                      UserIds: model.userIds,
                  }
                : {
                      Name: model.name,
                      Features: model.features,
                      UserIds: model.userIds,
                      Quantities: quantities,
                  };
        try {
            setLoading(true);
            await onSubmitDone(dtoBody);
            rest.onClose?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ModalTwo size={step === STEP.MEMBERS ? 'xlarge' : 'large'} as={Form} onSubmit={handleSubmit} {...rest}>
                <ModalTwoHeader
                    title={(() => {
                        if (step === STEP.NAME) {
                            return isEditing ? c('Action').t`Edit Gateway` : c('Title').t`Create Gateway`;
                        }

                        if (step === STEP.COUNTRIES) {
                            return c('Title').t`Add dedicated servers`;
                        }

                        return c('Title').t`Add users`;
                    })()}
                />
                <ModalTwoContent>
                    {deletedDedicatedIPsLoading ? (
                        <Loader />
                    ) : (
                        <>
                            {step === STEP.NAME && (
                                <GatewayNameField model={model} changeModel={changeModel} validator={validator} />
                            )}
                            {step === STEP.COUNTRIES && (
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
                                    loading={loading}
                                    model={model}
                                    changeModel={changeModel}
                                />
                            )}
                            {step === STEP.MEMBERS && (
                                <GatewayUserSelection
                                    loading={loading}
                                    users={users}
                                    model={model}
                                    changeModel={changeModel}
                                />
                            )}
                        </>
                    )}
                </ModalTwoContent>
                <ModalTwoFooter>
                    {showCancelButton || step !== STEP.NAME ? (
                        <Button color="weak" onClick={stepBack}>
                            {step === STEP.NAME
                                ? c('Action').t`Cancel`
                                : /* button to go back to previous step of gateway creation */ c('Action').t`Back`}
                        </Button>
                    ) : (
                        <div />
                    )}
                    <Button color="norm" type="submit" loading={loading} disabled={!canContinue}>
                        {step === STEP.MEMBERS
                            ? /* final step submit button of the creation, if not clean translation possible, it can also simply be "Create" */ c(
                                  'Action'
                              ).t`Done`
                            : /* button to continue to the next step of gateway creation */ c('Action').t`Continue`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
            {addServerConfirmationModal}
        </>
    );
};

export default GatewayModal;
