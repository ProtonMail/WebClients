import React from 'react';
import { c } from 'ttag';
import { formatImage } from 'proton-shared/lib/helpers/image';

import { Button } from '../button';

interface Props {
    value: string;
    onChange: () => void;
}

const ContactImageField = ({ value, onChange }: Props) => {
    return (
        <div>
            {value ? (
                <img className="max-w13e" src={formatImage(value)} referrerPolicy="no-referrer" />
            ) : (
                <Button onClick={onChange}>{c('Action').t`Upload picture`}</Button>
            )}
        </div>
    );
};

export default ContactImageField;
