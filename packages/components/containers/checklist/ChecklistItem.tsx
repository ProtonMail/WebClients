import { Icon, IconProps, classnames } from '@proton/components';

import './ChecklistItem.scss';

interface ChecklistItemProps {
    icon: IconProps['name'];
    text: string;
    complete: boolean;
    onClick: () => void;
}

const ChecklistItem = ({ icon, text, complete, onClick }: ChecklistItemProps) => {
    const liClassName = classnames(['checklist-item_root', 'mb1', complete && 'text-strike color-weak']);

    const mainIconClassName = classnames([
        'mt0-25 mr1-5 flex-item-noshrink',
        complete ? 'color-success' : 'color-primary',
    ]);

    return (
        <li className={liClassName}>
            <button onClick={onClick} type="button" className="flex flex-nowrap flex-align-items-start text-left w100">
                <Icon className={mainIconClassName} name={complete ? 'check' : icon} />
                <span>
                    <span className="mr1">{text}</span>
                    <Icon className="rotateZ-270" size={12} name="angle-down" />
                </span>
            </button>
        </li>
    );
};

export default ChecklistItem;
