import { DropdownMenuButton, Icon, IconName } from '@proton/components';

interface Props {
    name: string;
    icon: IconName;
    testId: string;
    action: () => void;
    close: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action, close }: Props) => {
    return (
        <DropdownMenuButton
            key={name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex flex-align-items-center flex-nowrap text-left"
            onClick={(e) => {
                e.stopPropagation();
                action();
                close();
            }}
            data-testid={testId}
        >
            <Icon className="mr-2" name={icon} />
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;
