import type { HTMLAttributes } from 'react';

import { getAllFieldLabels, getAllTypes } from '@proton/shared/lib/helpers/contacts';
import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    field: string;
    type?: string;
}

const ContactLabelProperty = ({ field, type, className, ...rest }: Props) => {
    const labels: { [key: string]: string } = getAllFieldLabels();
    // Some fields like email have sub-types like "home", "work" etc...
    const typesLabels = getAllTypes();
    const typeLabel = typesLabels[field].find((fieldType) => fieldType.value === type?.toLowerCase())?.text;

    const label: string = ['bday', 'anniversary'].includes(field)
        ? labels[field]
        : labels[type || ''] || typeLabel || type || labels[field];

    return (
        <div className={clsx(['text-semibold text-ellipsis', className])} {...rest} title={label}>
            {label}
        </div>
    );
};

export default ContactLabelProperty;
