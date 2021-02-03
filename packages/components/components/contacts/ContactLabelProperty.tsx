import React from 'react';

import { getAllFieldLabels } from 'proton-shared/lib/helpers/contacts';

interface Props {
    field: string;
    type: string;
}

const ContactLabelProperty = ({ field, type, ...rest }: Props) => {
    const labels: { [key: string]: string } = getAllFieldLabels();
    const label: string = labels[type] || type || labels[field];

    return (
        <label className="text-capitalize" {...rest}>
            {label}
        </label>
    );
};

export default ContactLabelProperty;
