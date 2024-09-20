import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useFormErrors from '@proton/components/components/v2/useFormErrors';

import type { CountryOptions } from '../../../helpers/countries';
import { GatewayCountrySelection } from './GatewayCountrySelection';
import type { GatewayDto } from './GatewayDto';
import type { GatewayModel } from './GatewayModel';
import { GatewayNameField } from './GatewayNameField';
import type { GatewayUser } from './GatewayUser';
import { GatewayUserSelection } from './GatewayUserSelection';
import { getInitialModel } from './helpers';
import { useAddedQuantities } from './useAddedQuantities';
import { useSpecificCountryCount } from './useSpecificCountryCount';

interface Props extends ModalProps<typeof Form> {
    countries: readonly string[];
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
    countries,
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
    const { validator, onFormSubmit } = useFormErrors();
    const [step, setStep] = useState(STEP.NAME);
    const [model, setModel] = useState(getInitialModel(countries));
    const [loading, setLoading] = useState(false);
    const remainingCount = useMemo(() => ownedCount - usedCount, [ownedCount, usedCount]);
    const addedCount = useAddedQuantities(model);
    const totalCountExceeded = useMemo(() => addedCount > remainingCount, [addedCount, remainingCount]);
    const specificCountryCount = useSpecificCountryCount(model, remainingCount, deletedInCountries);
    const needUpsell = useMemo(
        () => totalCountExceeded || specificCountryCount > 0,
        [totalCountExceeded, specificCountryCount]
    );
    const canContinue = useMemo(
        () => step !== STEP.COUNTRIES || !(needUpsell || (!singleServer && addedCount < 1)),
        [step, needUpsell, singleServer, addedCount]
    );

    const changeModel = (diff: Partial<GatewayDto>) => setModel((model: GatewayDto) => ({ ...model, ...diff }));

    const stepBack = () => {
        if (step === STEP.MEMBERS) {
            setStep(countries.length > 1 ? STEP.COUNTRIES : STEP.NAME);

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
            setStep(countries.length > 1 ? STEP.COUNTRIES : STEP.MEMBERS);

            return;
        }

        if (step === STEP.COUNTRIES) {
            setStep(STEP.MEMBERS);

            return;
        }

        const quantities: Record<string, number> = {};
        let total = 0;

        Object.keys(model.quantities || {}).forEach((country) => {
            const count = model.quantities?.[country] || 0;

            if (count > 0) {
                quantities[country] = count;
                total += count;
            }
        });

        const dtoBody: GatewayModel =
            singleServer || total === 1
                ? {
                      Name: model.name,
                      Country: model.country,
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
        <ModalTwo size={step === STEP.MEMBERS ? 'xlarge' : 'large'} as={Form} onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader
                title={(() => {
                    if (step === STEP.NAME) {
                        return isEditing ? c('Action').t`Edit Gateway` : c('Title').t`Create Gateway`;
                    }

                    if (step === STEP.COUNTRIES) {
                        return c('Title').t`Add servers`;
                    }

                    return c('Title').t`Add users`;
                })()}
            />
            <ModalTwoContent>
                {step === STEP.NAME && (
                    <GatewayNameField model={model} changeModel={changeModel} validator={validator} />
                )}
                {step === STEP.COUNTRIES && (
                    <GatewayCountrySelection
                        singleServer={singleServer}
                        countries={countries}
                        ownedCount={ownedCount}
                        usedCount={usedCount}
                        addedCount={addedCount}
                        needUpsell={needUpsell}
                        specificCountryCount={specificCountryCount}
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
                    <GatewayUserSelection loading={loading} users={users} model={model} changeModel={changeModel} />
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
    );
};

export default GatewayModal;
