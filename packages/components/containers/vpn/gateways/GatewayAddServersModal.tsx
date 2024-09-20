import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { CountryOptions } from '../../../helpers/countries';
import { GatewayCountrySelection } from './GatewayCountrySelection';
import type { GatewayDto } from './GatewayDto';
import type { GatewayUser } from './GatewayUser';
import { getInitialModel } from './helpers';
import { useAddedQuantities } from './useAddedQuantities';
import { useSpecificCountryCount } from './useSpecificCountryCount';

interface Props extends ModalStateProps {
    countries: readonly string[];
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
    const [model, setModel] = useState(getInitialModel(countries));
    const remainingCount = useMemo(() => ownedCount - usedCount, [ownedCount, usedCount]);
    const numberOfAddedServers = useAddedQuantities(model);
    const totalCountExceeded = useMemo(
        () => numberOfAddedServers > remainingCount,
        [numberOfAddedServers, remainingCount]
    );
    const specificCountryCount = useSpecificCountryCount(model, remainingCount, deletedInCountries);
    const needUpsell = useMemo(
        () => totalCountExceeded || specificCountryCount > 0,
        [totalCountExceeded, specificCountryCount]
    );

    const changeModel = (diff: Partial<GatewayDto>) => setModel((model) => ({ ...model, ...diff }));

    const handleSubmit = async () => {
        onSubmitDone(model.quantities || {});
        rest.onClose?.();
    };

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader title={c('Title').t`Add servers`} />
            <ModalTwoContent>
                <GatewayCountrySelection
                    singleServer={singleServer}
                    countries={countries}
                    ownedCount={ownedCount}
                    usedCount={usedCount}
                    addedCount={numberOfAddedServers}
                    needUpsell={needUpsell}
                    specificCountryCount={specificCountryCount}
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
                {!needUpsell && numberOfAddedServers >= 1 ? (
                    <Button color="norm" type="submit">
                        {c('Feature').ngettext(
                            msgid`Add (${numberOfAddedServers})`,
                            `Add (${numberOfAddedServers})`,
                            numberOfAddedServers
                        )}
                    </Button>
                ) : (
                    <Button color="norm" type="submit" disabled>
                        {c('Feature').t`Add`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default GatewayAddServersModal;
