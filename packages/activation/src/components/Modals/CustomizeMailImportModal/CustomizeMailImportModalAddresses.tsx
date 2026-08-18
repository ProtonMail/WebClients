import { c } from 'ttag';

import { Field, Label, Option, Row, SelectTwo } from '@proton/components';
import type { Address } from '@proton/shared/lib/interfaces';

import useAvailableAddresses from '../../../hooks/useAvailableAddresses';

interface Props {
    selectedAddressID: string;
    onChange: (address: Address) => void;
}

const CustomizeMailImportModalAddresses = ({ selectedAddressID, onChange }: Props) => {
    const { availableAddresses } = useAvailableAddresses();

    return (
        <>
            {availableAddresses && availableAddresses.length > 1 && (
                <div className="mb-4 border-bottom items-center">
                    <Row>
                        <Label className="flex items-center">{c('Label').t`Import to email address`}</Label>
                        <Field>
                            <SelectTwo
                                className="flex-1"
                                value={selectedAddressID}
                                onChange={({ value: addressID }) => {
                                    const nextAddress = availableAddresses.find((address) => address.ID === addressID);
                                    if (nextAddress) {
                                        onChange(nextAddress);
                                    } else {
                                        throw new Error('Address should be defined');
                                    }
                                }}
                                data-testid="CustomizeModal:addressSelect"
                            >
                                {availableAddresses.map((address) => (
                                    <Option
                                        key={address.ID}
                                        value={address.ID}
                                        title={address.Email}
                                        data-testid="CustomizeModal:addressRow"
                                    >
                                        {address.Email}
                                    </Option>
                                ))}
                            </SelectTwo>
                        </Field>
                    </Row>
                </div>
            )}
        </>
    );
};

export default CustomizeMailImportModalAddresses;
