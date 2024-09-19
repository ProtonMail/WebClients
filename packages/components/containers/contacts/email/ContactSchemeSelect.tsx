import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import type { CONTACT_PGP_SCHEMES } from '@proton/shared/lib/constants';
import { PGP_SCHEMES, PGP_SCHEMES_MORE } from '@proton/shared/lib/constants';
import { PGP_SCHEME_TEXT } from '@proton/shared/lib/contacts/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';

import { SelectTwo } from '../../../components';
import type { SelectChangeEvent } from '../../../components/selectTwo/select';

const { INLINE, MIME } = PGP_SCHEME_TEXT;

const { PGP_MIME, PGP_INLINE } = PGP_SCHEMES;

interface Props {
    value: string;
    mailSettings?: MailSettings;
    onChange: (value: CONTACT_PGP_SCHEMES) => void;
}

const ContactSchemeSelect = ({ value, mailSettings, onChange }: Props) => {
    const defaultValueText = mailSettings?.PGPScheme === PACKAGE_TYPE.SEND_PGP_INLINE ? INLINE : MIME;

    const handleChange = ({ value }: SelectChangeEvent<string>) => onChange(value as CONTACT_PGP_SCHEMES);

    return (
        <SelectTwo value={value} onChange={handleChange} data-testid="email-settings:scheme-dropdown">
            <Option
                title={c('Default encryption scheme').t`Use global default (${defaultValueText})`}
                value={PGP_SCHEMES_MORE.GLOBAL_DEFAULT}
                data-testid="scheme-dropdown:default"
            />
            <Option title={MIME} value={PGP_MIME} data-testid="scheme-dropdown:pgp_mime" />
            <Option title={INLINE} value={PGP_INLINE} data-testid="scheme-dropdown:pgp_inline" />
        </SelectTwo>
    );
};

export default ContactSchemeSelect;
