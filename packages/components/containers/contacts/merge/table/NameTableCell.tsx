import clsx from '@proton/utils/clsx';

import { Checkbox } from '../../../../components';

interface Props {
    contactID: string;
    highlightedID: string;
    checked: boolean;
    deleted: boolean;
    greyedOut: boolean;
    name: string;
    onToggle: (ID: string) => void;
}

const NameTableCell = ({ name, contactID, highlightedID, checked, deleted, greyedOut, onToggle }: Props) => {
    const handleToggle = () => onToggle(contactID);

    return (
        <div className="flex flex-nowrap items-center">
            <Checkbox
                checked={checked}
                onChange={handleToggle}
                className={`flex items-center flex-item-noshrink mr-2 ${deleted ? 'visibility-hidden' : ''}`}
                data-testid="merge-model:name-checkbox"
            />
            <span
                className={clsx([
                    'max-w-full',
                    'inline-block',
                    'text-ellipsis',
                    greyedOut && 'color-weak',
                    contactID === highlightedID && 'text-bold',
                ])}
            >
                {name}
            </span>
        </div>
    );
};

export default NameTableCell;
