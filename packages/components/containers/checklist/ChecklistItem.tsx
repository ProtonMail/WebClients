import { Icon, IconName, classnames } from '@proton/components';

import './ChecklistItem.scss';

interface ChecklistItemProps {
    icon: IconName;
    text: string;
    complete: boolean;
    onClick: () => void;
}

const ChecklistItem = ({ icon, text, complete, onClick }: ChecklistItemProps) => {
    const liClassName = classnames([
        'checklist-item_root',
        'mb1',
        complete ? 'text-strike color-weak' : 'checklist-item_root--incomplete',
    ]);

    const mainIconClassName = classnames([
        'mt0-25 mr1-5 flex-item-noshrink',
        complete ? 'color-success' : 'color-primary',
    ]);

    const listItemContent = (
        <>
            <Icon className={mainIconClassName} name={complete ? 'checkmark' : icon} />
            <span>
                <span className="mr1">{text}</span>
                {!complete && <Icon size={12} name="chevron-right" />}
            </span>
        </>
    );

    if (complete) {
        return (
            <li className={liClassName}>
                <span className="flex flex-nowrap flex-align-items-start text-left w100">{listItemContent}</span>
            </li>
        );
    }

    return (
        <li className={liClassName}>
            <button onClick={onClick} type="button" className="flex flex-nowrap flex-align-items-start text-left w100">
                {listItemContent}
            </button>
        </li>
    );
};

export default ChecklistItem;
