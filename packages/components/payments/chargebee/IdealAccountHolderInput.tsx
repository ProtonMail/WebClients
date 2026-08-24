import { c } from 'ttag';

import InputFieldTwo from '../../components/v2/field/InputField';
import type { ChargebeeIdealProcessorHook } from '../react-extensions/useChargebeeIdeal';

export interface IdealAccountHolderInputProps {
    chargebeeIdeal: ChargebeeIdealProcessorHook;
}

export const IdealAccountHolderInput = ({ chargebeeIdeal }: IdealAccountHolderInputProps) => {
    return (
        <InputFieldTwo
            label={c('Label').t`Account holder name`}
            value={chargebeeIdeal.accountHolderName}
            onValue={chargebeeIdeal.setAccountHolderName}
            onBlur={chargebeeIdeal.touchAccountHolderName}
            error={chargebeeIdeal.accountHolderNameError || undefined}
            id="ideal-account-holder-name"
            name="ideal-account-holder-name"
            autoComplete="off"
            data-protonpass-ignore={true}
            data-testid="ideal-account-holder-name"
        />
    );
};
