import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { TransfersManagerButtonsProps } from './interfaces';

const Buttons = ({ className, buttons, id }: TransfersManagerButtonsProps) => {
    const elClassName = clsx(['flex flex-nowrap justify-end', className]);

    return (
        <div className={elClassName} id={id}>
            {buttons.map(({ disabled, onClick, title, testId, iconName }) => (
                <Tooltip title={title} key={title}>
                    <Button
                        icon
                        type="button"
                        disabled={disabled}
                        onClick={onClick}
                        className="transfers-manager-list-item-controls-button on-rtl-mirror"
                        data-testid={testId ? testId : undefined}
                    >
                        <Icon size={12} name={iconName} alt={title} />
                    </Button>
                </Tooltip>
            ))}
        </div>
    );
};

export default Buttons;
