import React from 'react';
import { c } from 'ttag';

import { Button } from '../button';

interface Props {
    value: string;
    onChange: () => void;
}

const ContactImageField = ({ value, onChange }: Props) => {
    return (
        <div>
            {value ? (
                <img className="max-w13e" src={value} referrerPolicy="no-referrer" />
            ) : (
                <Button onClick={onChange}>{c('Action').t`Upload picture`}</Button>
            )}
        </div>
    );
};

export default ContactImageField;
