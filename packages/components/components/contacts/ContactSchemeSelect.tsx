import React, { ChangeEvent } from 'react';
import { c } from 'ttag';

import { PACKAGE_TYPE, PGP_SCHEMES, PGP_SCHEMES_MORE, CONTACT_PGP_SCHEMES } from '@proton/shared/lib/constants';
import { PGP_SCHEME_TEXT } from '@proton/shared/lib/contacts/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

import Select from '../select/Select';

const { INLINE, MIME } = PGP_SCHEME_TEXT;

const { PGP_MIME, PGP_INLINE } = PGP_SCHEMES;

interface Props {
    value: string;
    mailSettings?: MailSettings;
    onChange: (value: CONTACT_PGP_SCHEMES) => void;
}

const ContactSchemeSelect = ({ value, mailSettings, onChange }: Props) => {
    const defaultValueText = mailSettings?.PGPScheme === PACKAGE_TYPE.SEND_PGP_INLINE ? INLINE : MIME;

    const options = [
        {
            value: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
            text: c('Default encryption scheme').t`Use global default (${defaultValueText})`,
        },
        { value: PGP_MIME, text: MIME },
        { value: PGP_INLINE, text: INLINE },
    ];

    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(target.value as CONTACT_PGP_SCHEMES);

    return <Select options={options} value={value} onChange={handleChange} />;
};

export default ContactSchemeSelect;
