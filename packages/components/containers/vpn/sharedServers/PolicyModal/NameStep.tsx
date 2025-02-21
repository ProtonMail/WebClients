import React, { useCallback } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';

interface SharedServersNameStepProps {
    policyName: string;
    onChangePolicyName: (value: string) => void;
}

const NameStep = ({ policyName, onChangePolicyName }: SharedServersNameStepProps) => {
    const handleValueChange = useCallback(
        (newValue: string) => {
            onChangePolicyName(newValue);
        },
        [onChangePolicyName]
    );

    return (
        <div>
            <InputFieldTwo
                id="policyName"
                autoFocus
                value={policyName}
                maxLength={40}
                minLength={3}
                onValue={handleValueChange}
                label={c('Label').t`Policy name`}
            />
        </div>
    );
};

export default NameStep;
