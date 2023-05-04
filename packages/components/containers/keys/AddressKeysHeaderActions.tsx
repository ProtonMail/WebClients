import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions, Select } from '../../components';

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
        <div className="mb-4 flex flex-align-items-start">
            {addresses.length > 1 && (
                <div className="mr-4 mb-2">
                    <Select
                        value={addressIndex}
                        options={addresses.map(({ Email }, i) => ({ text: Email, value: i }))}
                        onChange={onChangeAddress}
                    />
                </div>
            )}
            {createActions.length ? (
                <span className="inline-flex mr-4 mb-2">
                    <DropdownActions list={createActions} />
                </span>
            ) : null}
        </div>
    );
};

export default AddressKeysHeaderActions;
