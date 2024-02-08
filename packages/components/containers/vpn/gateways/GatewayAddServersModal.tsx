import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components/components';

import { GatewayCountrySelection } from './GatewayCountrySelection';
import { GatewayDto } from './GatewayDto';
import { GatewayUser } from './GatewayUser';
import { getInitialModel } from './helpers';
import { useAddedQuantities } from './useAddedQuantities';
import { useSpecificCountryCount } from './useSpecificCountryCount';

interface Props extends ModalStateProps {
    countries: readonly string[];
    deletedInCountries: Record<string, number>;
    ownedCount: number;
    usedCount: number;
    users: readonly GatewayUser[];
    language: string | readonly string[];
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
    language,
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
                    language={language}
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
