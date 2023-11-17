import { DropdownMenuButton } from '../dropdown';
import { Icon, IconName } from '../icon';

interface Props {
    name: string;
    icon: IconName;
    testId?: string;
    action: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action }: Props) => {
    return (
        <DropdownMenuButton
            key={name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex items-center flex-nowrap text-left"
            onClick={(e) => {
                e.stopPropagation();
                action();
            }}
            data-testid={testId}
        >
            <Icon className="mr-2 flex-item-noshrink" name={icon} />
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;
