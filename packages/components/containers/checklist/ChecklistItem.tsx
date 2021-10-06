import { ComponentPropsWithoutRef } from 'react';

import { Icon, IconProps, classnames } from '@proton/components';

import './ChecklistItem.scss';

interface ChecklistItemProps extends ComponentPropsWithoutRef<'li'> {
    icon: IconProps['name'];
    text: string;
    complete: boolean;
}

const ChecklistItem = ({ icon, text, complete, ...rest }: ChecklistItemProps) => {
    const liClassName = classnames(['checklist-item_root', 'mb1 cursor-pointer', complete && 'text-strike color-weak']);

    const mainIconClassName = classnames(['mr1-5', complete ? 'color-success' : 'color-primary']);

    return (
        <li className={liClassName} {...rest}>
            <Icon className={mainIconClassName} name={complete ? 'check' : icon} />
            {text}
            <Icon className="rotateZ-270 ml1" size={12} name="angle-down" />
        </li>
    );
};

export default ChecklistItem;
