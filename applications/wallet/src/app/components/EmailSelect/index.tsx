import { useEffect, useMemo } from 'react';

import { keyBy } from 'lodash';
import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import { useDecryptedApiWalletsData } from '@proton/wallet';

import { Select } from '../../atoms';

interface Props {
    value?: string;
    onChange: (a: string | undefined) => void;
}

export const EmailSelect = ({ value, onChange }: Props) => {
    const [addresses = [], loadingAddresses] = useAddresses();

    const addressesById = useMemo(() => keyBy(addresses, (a) => a.ID), [addresses]);

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

    return (
        <Select
            label={c('Wallet invite').t`Your email (visible to recipient)`}
            id="email-selector"
            value={value}
            disabled={loadingAddresses}
            onChange={(event) => {
                onChange(event.value);
            }}
            options={addresses.map((option) => ({
                label: option.Email,
                value: option.ID,
                id: option.ID,
                children: (
                    <div className="flex flex-row items-center">
                        {option.Email}{' '}
                        {walletAccountEmails?.includes(option.Email) ? (
                            <Tooltip title={c('Wallet invite').t`This email can receive Bitcoin via Email`}>
                                <Icon name="brand-bitcoin" className="ml-2" />
                            </Tooltip>
                        ) : (
                            <Tooltip
                                title={c('Wallet invite')
                                    .t`Warning: the recipient will not be able to send Bitcoin via Email to this email.`}
                            >
                                <Icon name="exclamation-circle" className="ml-2" />
                            </Tooltip>
                        )}
                    </div>
                ),
            }))}
            renderSelected={(selected) => selected && addressesById[selected]?.Email}
        />
    );
};
