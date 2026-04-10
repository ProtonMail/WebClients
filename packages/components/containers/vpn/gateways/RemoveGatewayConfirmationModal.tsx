import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { type CountryOptions, getLocalizedCountryByAbbr } from '@proton/payments/core/countries';
import type { Either } from '@proton/shared/lib/interfaces';

import { CountryFlagAndName } from './CountryFlagAndName';
import type { Gateway } from './Gateway';

const useCreateSubmitNotifications = () => {
    const { createNotification } = useNotifications();

    const success = () =>
        createNotification({
            key: 'gateway-deletion-success',
            text: c('Info').t`Gateway deleted`,
            type: 'info',
        });

    const failure = () =>
        createNotification({
            key: 'gateway-deletion-failure',
            text: c('Info').t`Gateway couldn't be deleted. Please try again`,
            type: 'error',
        });

    return { success, failure };
};

const groupServers = (gateway: Gateway) => {
    const counts = new Map<string, number>();

    for (const { ExitCountry } of gateway.Logicals) {
        const count = counts.get(ExitCountry) ?? 0;
        counts.set(ExitCountry, count + 1);
    }

    return counts;
};

interface Props extends ModalStateProps {
    onSubmit: () => Promise<Either<'ok', 'error'>>;
    gateway: Gateway;
    countryOptions: CountryOptions;
}

export const RemoveGatewayConfirmationModal = ({ onSubmit, gateway, countryOptions, ...rest }: Props) => {
    const name = gateway.Name;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const notifications = useCreateSubmitNotifications();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const status = await onSubmit();
        setIsSubmitting(false);

        status.match({
            left: () => {
                notifications.success();
                rest.onClose?.();
            },
            right: () => {
                notifications.failure();
            },
        });
    };

    const groupedServers = groupServers(gateway);

    return (
        <ModalTwo as={Form} size="small" onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader title={c('Title').t`Delete ${name}?`} />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap gap-6">
                    <div className="flex flex-column flex-nowrap gap-3">
                        {[...groupedServers].map(([exitCountry, number]) => (
                            <div key={exitCountry} className="flex">
                                <div className="w-2/3">
                                    <CountryFlagAndName
                                        countryCode={exitCountry}
                                        countryName={getLocalizedCountryByAbbr(exitCountry, countryOptions)}
                                        className="mb-1"
                                    />
                                </div>
                                <span className="w-1/3">
                                    {c('Info').ngettext(msgid`${number} server`, `${number} servers`, number)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-weak p-3 rounded flex flex-row flex-nowrap gap-2">
                        <div className="shrink-0">
                            <IcExclamationTriangleFilled className="color-warning" />
                        </div>
                        <span>
                            {c('Warning')
                                .t`Servers in this gateway will enter a 10-day deactivation period. These servers can be added to a new Gateway, but their country cannot be changed.`}
                        </span>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={rest.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="danger" type="submit" loading={isSubmitting}>
                    {c('Action').t`Delete gateway`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
