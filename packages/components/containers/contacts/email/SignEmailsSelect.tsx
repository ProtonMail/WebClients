import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SIGN } from '@proton/shared/lib/mail/mailSettings';

import type { SelectChangeEvent } from '../../../components/selectTwo/select';

interface Props {
    id?: string;
    value?: boolean;
    mailSettings?: MailSettings;
    disabled?: boolean;
    onChange: (value: boolean | undefined) => void;
}

const SignEmailsSelect = ({ id, value, mailSettings, disabled, onChange }: Props) => {
    // An `undefined` value indicates the "default" option is selected.
    // However, `undefined` cannot be used as `Option` identifier, hence we convert to/from `null`.
    const handleChange = ({ value }: SelectChangeEvent<boolean | null>) => onChange(value === null ? undefined : value);

    const SIGN_LABEL = c('Signing preference for emails').t`Sign`;
    const DO_NOT_SIGN_LABEL = c('Signing preference for emails').t`Don't sign`;
    const globalDefaultText = mailSettings?.Sign === SIGN.ENABLED ? SIGN_LABEL : DO_NOT_SIGN_LABEL;

    return (
        <SelectTwo id={id} value={value === undefined ? null : value} onChange={handleChange} disabled={disabled}>
            <Option title={c('Default signing preference').t`Use global default (${globalDefaultText})`} value={null} />
            <Option title={SIGN_LABEL} value={true} />
            <Option title={DO_NOT_SIGN_LABEL} value={false} />
        </SelectTwo>
    );
};

export default SignEmailsSelect;
