import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Icon, Option, SettingsLink } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { APPS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';
import { splitExternalAddresses } from '@proton/shared/lib/mail/addresses';

import { getFromAddresses } from 'proton-mail/helpers/addresses';

const useGetSenderOptions = (message: MessageState) => {
    const [addresses = []] = useAddresses();
    const [user] = useUser();

    const getOption = (address: Address, className?: string) => {
        return (
            <Option
                value={address.Email}
                title={address.Email}
                key={address.Email}
                data-testid={`addresses:${address.Email}`}
                className={className}
            >
                <span className="inline-flex flex-nowrap flex-row items-center max-w-full">
                    <span className="text-ellipsis">{address.Email}</span>
                    <Icon name="chevron-down-filled" className="select--inline-caret-option shrink-0 ml-2" />
                </span>
            </Option>
        );
    };

    const availableAddresses = getFromAddresses(
        addresses,
        message.draftFlags?.originalTo || message.draftFlags?.originalFrom || message.data?.Sender?.Address
    );

    const { otherAddresses, externalAddresses } = splitExternalAddresses(availableAddresses);

    const addressesOptions = [];

    otherAddresses.forEach((address) => {
        addressesOptions.push(getOption(address));
    });

    externalAddresses.map((address, index) => {
        addressesOptions.push(getOption(address, otherAddresses.length > 0 && index === 0 ? 'border-top' : undefined));
    });

    if (user.hasPaidMail) {
        addressesOptions.push(
            <div key="create-new-adress" className="pl-4 py-2 border-top">
                <SettingsLink path="/identity-addresses#addresses" app={APPS.PROTONMAIL}>
                    {c('Label').t`Manage my addresses`}
                </SettingsLink>
            </div>
        );
    }

    return addressesOptions;
};

export default useGetSenderOptions;
