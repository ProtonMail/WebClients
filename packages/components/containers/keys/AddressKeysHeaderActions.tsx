import * as React from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Address } from '@proton/shared/lib/interfaces';

import { DropdownActions, Select } from '../../components';

interface Props {
    addresses: Address[];
    addressIndex: number;
    onAddKey?: () => void;
    onImportKey?: () => void;
    onChangeAddress: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const AddressKeysHeaderActions = ({ addresses, addressIndex, onAddKey, onImportKey, onChangeAddress }: Props) => {
    const createActions = [
        onAddKey && {
            text: c('Action').t`Create key`,
            onClick: onAddKey,
        },
        onImportKey && {
            text: c('Action').t`Import key`,
            onClick: onImportKey,
        },
    ].filter(isTruthy);

    if (!createActions.length) {
        return null;
    }

    return (
        <div className="mb1 flex flex-align-items-start">
            {addresses.length > 1 && (
                <div className="mr1 mb0-5">
                    <Select
                        value={addressIndex}
                        options={addresses.map(({ Email }, i) => ({ text: Email, value: i }))}
                        onChange={onChangeAddress}
                    />
                </div>
            )}
            {createActions.length ? (
                <span className="inline-flex mr1 mb0-5">
                    <DropdownActions list={createActions} />
                </span>
            ) : null}
        </div>
    );
};

export default AddressKeysHeaderActions;
