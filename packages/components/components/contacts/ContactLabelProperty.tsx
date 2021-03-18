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
        <span className="text-capitalize text-semibold" {...rest}>
            {label}
        </span>
    );
};

export default ContactLabelProperty;
