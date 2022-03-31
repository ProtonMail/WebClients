import { c } from 'ttag';
import { PACKAGE_TYPE, PGP_SCHEMES, PGP_SCHEMES_MORE, CONTACT_PGP_SCHEMES } from '@proton/shared/lib/constants';
import { PGP_SCHEME_TEXT } from '@proton/shared/lib/contacts/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Option, SelectTwo } from '../../../components';
import { SelectChangeEvent } from '../../../components/selectTwo/select';

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
        <SelectTwo value={value} onChange={handleChange}>
            <Option
                title={c('Default encryption scheme').t`Use global default (${defaultValueText})`}
                value={PGP_SCHEMES_MORE.GLOBAL_DEFAULT}
            />
            <Option title={MIME} value={PGP_MIME} />
            <Option title={INLINE} value={PGP_INLINE} />
        </SelectTwo>
    );
};

export default ContactSchemeSelect;
