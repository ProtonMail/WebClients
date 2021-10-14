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

    const mainIconClassName = classnames(['mr1-5', complete ? 'color-success' : 'color-primary']);

    return (
        <li className={liClassName}>
            <button onClick={onClick} type="button" className="flex flex-align-items-center w100">
                <Icon className={mainIconClassName} name={complete ? 'check' : icon} />
                <span>{text}</span>
                <Icon className="rotateZ-270 ml1" size={12} name="angle-down" />
            </button>
        </li>
    );
};

export default ChecklistItem;
