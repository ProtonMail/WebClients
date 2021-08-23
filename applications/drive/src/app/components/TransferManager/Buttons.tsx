import { Icon, Button, classnames } from '@proton/components';

import { TransfersManagerButtonsProps } from './interfaces';

const Buttons = ({ className, buttons, id }: TransfersManagerButtonsProps) => {
    const elClassName = classnames(['flex flex-nowrap flex-justify-end', className]);

    return (
        <div className={elClassName} id={id}>
            {buttons.map((button) => (
                <Button
                    icon
                    type="button"
                    disabled={button.disabled}
                    onClick={button.onClick}
                    className="transfers-manager-list-item-controls-button"
                    title={button.title}
                    key={button.title}
                >
                    <Icon size={12} name={button.iconName} />
                </Button>
            ))}
        </div>
    );
};

export default Buttons;
