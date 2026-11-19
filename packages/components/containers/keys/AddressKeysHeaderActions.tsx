import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import type { Address } from '@proton/shared/lib/interfaces/Address';
import isTruthy from '@proton/utils/isTruthy';

import DropdownActions from '../../components/dropdown/DropdownActions';
import Select from '../../components/select/Select';

interface Props {
    addresses: Address[];
    addressIndex: number;
    onAddKey?: () => void;
    onImportKey?: () => void;
    onChangeAddress: (event: ChangeEvent<HTMLSelectElement>) => void;
}

const AddressKeysHeaderActions = ({ addresses, addressIndex, onAddKey, onImportKey, onChangeAddress }: Props) => {
    const createActions = [
        onAddKey && {
            text: c('Action').t`Generate key`,
            onClick: onAddKey,
        },
        onImportKey && {
            text: c('Action').t`Import key`,
            onClick: onImportKey,
        },
    ].filter(isTruthy);

    if (!createActions.length && addresses.length <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-start gap-2 md:gap-4">
            {addresses.length > 1 && (
                <div>
                    <Select
                        value={addressIndex}
                        options={addresses.map(({ Email }, i) => ({ text: Email, value: i }))}
                        onChange={onChangeAddress}
                    />
                </div>
            )}
            {createActions.length ? (
                <span className="inline-flex">
                    <DropdownActions list={createActions} />
                </span>
            ) : null}
        </div>
    );
};

export default AddressKeysHeaderActions;
