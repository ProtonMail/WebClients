import { HTMLAttributes } from 'react';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLLabelElement> {
    field: string;
    type: string;
}

const ContactLabelProperty = ({ field, type, className, ...rest }: Props) => {
    const labels: { [key: string]: string } = getAllFieldLabels();
    const label: string = labels[type] || type || labels[field];

    return (
        <span className={classnames(['text-capitalize text-semibold', className])} {...rest}>
            {label}
        </span>
    );
};

export default ContactLabelProperty;
