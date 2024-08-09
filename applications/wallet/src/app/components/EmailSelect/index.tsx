import { useEffect, useMemo } from 'react';

import { keyBy } from 'lodash';
import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import { useDecryptedApiWalletsData } from '@proton/wallet';

import { Select } from '../../atoms';
import { ANONYMOUS_SENDER_ADDRESS_ID } from '../../constants/wallet';

interface Props {
    value?: string;
    onChange: (a: string | undefined) => void;
    extraOptions?: { Email: string; ID: string }[];
}

export const EmailSelect = ({ value, onChange, extraOptions }: Props) => {
    const [addresses = [], loadingAddresses] = useAddresses();

    const allAddressesOptions = useMemo(() => [...(extraOptions ?? []), ...addresses], [addresses, extraOptions]);
    const addressesById = useMemo(() => keyBy(allAddressesOptions, (a) => a.ID), [allAddressesOptions]);

    useEffect(() => {
        const address = value && addressesById[value];

        if (!address) {
            onChange(addresses.at(0)?.ID);
        }
    }, [addresses, addressesById, onChange, value]);

    const { decryptedApiWalletsData } = useDecryptedApiWalletsData();
    const walletAccountEmails = useMemo(
        () => decryptedApiWalletsData?.flatMap((w) => w.WalletAccounts.flatMap((w) => w.Addresses.map((a) => a.Email))),
        [decryptedApiWalletsData]
    );

    const icon = (option: { Email: string; ID: string }) => {
        if (option.ID === ANONYMOUS_SENDER_ADDRESS_ID) {
            return null;
        }

        return walletAccountEmails?.includes(option.Email) ? (
            <Tooltip title={c('Wallet invite').t`This email can receive Bitcoin via Email`}>
                <Icon name="brand-bitcoin" className="ml-auto color-hint" />
            </Tooltip>
        ) : (
            <Tooltip
                title={c('Wallet invite')
                    .t`Warning: the recipient will not be able to send Bitcoin via Email to this email.`}
            >
                <Icon name="exclamation-circle" className="ml-auto color-hint" />
            </Tooltip>
        );
    };

    return (
        <Select
            label={c('Wallet invite').t`Your email (visible to recipient)`}
            id="email-selector"
            value={value}
            disabled={loadingAddresses}
            onChange={(event) => {
                onChange(event.value);
            }}
            readOnly={allAddressesOptions.length <= 1}
            options={allAddressesOptions.map((option) => ({
                label: option.Email,
                value: option.ID,
                id: option.ID,
                children: (
                    <div className="flex flex-row items-center py-2">
                        {option.Email}
                        {icon(option)}
                    </div>
                ),
            }))}
            renderSelected={(selected) => selected && addressesById[selected]?.Email}
        />
    );
};
