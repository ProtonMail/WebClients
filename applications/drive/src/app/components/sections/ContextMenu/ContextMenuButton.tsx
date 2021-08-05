import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    name: string;
    icon: string;
    testId: string;
    action: () => void;
    close: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action, close }: Props) => {
    return (
        <DropdownMenuButton
            key={name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex flex-nowrap text-left"
            onClick={(e) => {
                e.stopPropagation();
                action();
                close();
            }}
            data-testid={testId}
        >
            <Icon className="mt0-25 mr0-5" name={icon} />
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;
