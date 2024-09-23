import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { maxLengthValidator, minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { GatewayDto } from './GatewayDto';

type GatewayName = Pick<GatewayDto, 'name'>;

interface Props {
    model: GatewayName;
    changeModel: (diff: Partial<GatewayDto>) => void;
    validator: (validations: string[]) => string;
}

export const GatewayNameField = ({ model, changeModel, validator }: Props) => {
    const noSpaceMessage = c('Info').t`Must not contain spaces.`;
    const formatMessage = c('Info').t`Must contain only letters, digits, and dashes (-).`;
    const startWithLetterMessage = c('Info').t`Must start with a letter.`;

    const gatewayNameNoSpaceValidator = (value: string) => (/\s/.test(value) ? noSpaceMessage : '');
    const gatewayNameStartWithLetterValidator = (value: string) => (/^[A-Z]/.test(value) ? '' : startWithLetterMessage);
    const gatewayNameValidator = (value: string) => (/^[A-Z][A-Z0-9-]+$/.test(value) ? '' : formatMessage);

    const name = model.name || '';

    return (
        <>
            <InputFieldTwo
                autoFocus
                label={c('Label').t`Gateway name`}
                placeholder="MY-COMPANY-OFFICE"
                value={name}
                onValue={(value: string) => {
                    changeModel({ name: value.toUpperCase() });
                }}
                error={validator([
                    requiredValidator(name),
                    minLengthValidator(name, 3),
                    maxLengthValidator(name, 20),
                    gatewayNameStartWithLetterValidator(name),
                    gatewayNameNoSpaceValidator(name),
                    gatewayNameValidator(name),
                ])}
            />
            <div>
                <ul className="pl-4 mt-2 color-weak">
                    <li>{c('Info').t`Must be between 3 and 20 characters long.`}</li>
                    <li>{startWithLetterMessage}</li>
                    <li>{formatMessage}</li>
                    <li>{noSpaceMessage}</li>
                </ul>
            </div>
        </>
    );
};

export default GatewayNameField;
