import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Label, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import Form from '@proton/components/components/form/Form';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import type { CountryOptions } from '@proton/components/helpers/countries';

import { CountryFlagAndName } from './CountryFlagAndName';
import type { GatewayLocation } from './GatewayLocation';
import { getLocationDisplayName, getLocationFromId } from './helpers';

interface Props extends ModalStateProps {
    totalQuantities: Record<string, number>;
    countryOptions: CountryOptions;
    onSubmitDone: () => void;
}

const RemoveServerConfirmationModal = ({ totalQuantities, countryOptions, onSubmitDone, ...rest }: Props) => {
    const handleSubmit = async () => {
        onSubmitDone();
        rest.onClose?.();
    };

    const locations: [locationName: GatewayLocation, count: number][] = [];
    let totalServerCount = 0;

    Object.keys(totalQuantities).forEach((locationId) => {
        locations.push([getLocationFromId(locationId), totalQuantities[locationId]]);

        totalServerCount += totalQuantities[locationId];
    });

    return (
        <ModalTwo as={Form} size="small" onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader
                title={c('Title').ngettext(
                    msgid`Add ${totalServerCount} server?`,
                    `Add ${totalServerCount} servers?`,
                    totalServerCount
                )}
            />
            <ModalTwoContent>
                <>
                    {locations.map((location) => {
                        const number = location[1];

                        return (
                            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                                <Label className="flex-1">
                                    <CountryFlagAndName
                                        countryCode={location[0].Country}
                                        countryName={getLocationDisplayName(location[0], countryOptions)}
                                    />
                                </Label>
                                <>{c('Info').ngettext(msgid`${number} server`, `${number} servers`, number)}</>
                            </div>
                        );
                    })}
                </>
                <div className="flex flex-nowrap mb-4 rounded p-2 bg-weak">
                    <Icon name="exclamation-triangle-filled" className="color-warning shrink-0" />
                    <div className="ml-2">
                        {c('Info')
                            .t`It takes 10 days to change a server's country, so make sure your selection is correct.`}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={rest.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit">
                    {c('Feature').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RemoveServerConfirmationModal;
