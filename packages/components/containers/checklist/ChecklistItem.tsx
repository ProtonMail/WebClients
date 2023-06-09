import { Icon, IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './ChecklistItem.scss';

interface ChecklistItemProps {
    icon: IconName;
    text: string;
    complete: boolean;
    onClick: () => void;
}

const ChecklistItem = ({ icon, text, complete, onClick }: ChecklistItemProps) => {
    const liClassName = clsx([
        'checklist-item_root',
        'mb-4',
        complete ? 'text-strike color-weak' : 'checklist-item_root--incomplete',
    ]);

    const mainIconClassName = clsx(['mr-6 flex-item-noshrink', complete ? 'color-success' : 'color-primary']);

    const listItemContent = (
        <>
            <Icon className={mainIconClassName} name={complete ? 'checkmark' : icon} />
            <span>
                <span className="mr-4">{text}</span>
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
