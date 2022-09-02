import { HTMLAttributes } from 'react';

import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';

import { classnames } from '../../../helpers';

interface Props extends HTMLAttributes<HTMLDivElement> {
    field: string;
    type?: string;
}

const ContactLabelProperty = ({ field, type, className, ...rest }: Props) => {
    const labels: { [key: string]: string } = getAllFieldLabels();
    const label: string = labels[type || ''] || type || labels[field];

    return (
        <div className={classnames(['text-capitalize text-semibold text-ellipsis', className])} {...rest} title={label}>
            {label}
        </div>
    );
};

export default ContactLabelProperty;
