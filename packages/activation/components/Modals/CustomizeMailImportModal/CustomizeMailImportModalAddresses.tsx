import { c } from 'ttag';

import useAvailableAddresses from '@proton/activation/hooks/useAvailableAddresses';
import { Field, Label, Option, Row, SelectTwo } from '@proton/components/components';
import { Address } from '@proton/shared/lib/interfaces';

interface Props {
    selectedAddressID: string;
    onChange: (address: Address) => void;
}

const CustomizeMailImportModalAddresses = ({ selectedAddressID, onChange }: Props) => {
    const { availableAddresses } = useAvailableAddresses();

    return (
        <>
            {availableAddresses.length > 1 && (
                <div className="mb1 border-bottom flex-align-items-center">
                    <Row>
                        <Label className="flex flex-align-items-center">{c('Label').t`Import to email address`}</Label>
                        <Field>
                            <SelectTwo
                                className="flex-item-fluid"
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
