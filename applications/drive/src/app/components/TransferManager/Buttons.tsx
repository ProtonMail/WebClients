import { Icon, Button, classnames } from '@proton/components';

import { TransfersManagerButtonsProps } from './interfaces';

const Buttons = ({ className, buttons, id }: TransfersManagerButtonsProps) => {
    const elClassName = classnames(['flex flex-nowrap flex-justify-end', className]);

    return (
        <div className={elClassName} id={id}>
            {buttons.map(({ disabled, onClick, title, actionType, iconName }) => (
                <Button
                    icon
                    type="button"
                    disabled={disabled}
                    onClick={onClick}
                    className="transfers-manager-list-item-controls-button"
                    title={title}
                    key={title}
                    data-test-id={actionType ? `drive-transfers-manager:toolbar-button-${actionType}` : undefined}
                >
                    <Icon size={12} name={iconName} />
                </Button>
            ))}
        </div>
    );
};

export default Buttons;
