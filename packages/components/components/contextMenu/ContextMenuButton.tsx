import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { type IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';

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
            <Icon className="mr-2 shrink-0" name={icon} />
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;
