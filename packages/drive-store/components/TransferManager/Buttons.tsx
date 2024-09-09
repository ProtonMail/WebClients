import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { TransfersManagerButtonsProps } from './interfaces';

const Buttons = ({ className, buttons, id, children }: TransfersManagerButtonsProps) => {
    const elClassName = clsx(['flex flex-nowrap justify-end', className]);

    return (
        <div className={elClassName} id={id}>
            {children}
            {buttons.map(({ disabled, onClick, title, testId, iconName }) => (
                <Tooltip title={title} key={title}>
                    <Button
                        icon
                        type="button"
                        disabled={disabled}
                        onClick={onClick}
                        className="transfers-manager-list-item-controls-button rtl:mirror"
                        data-testid={testId ? testId : undefined}
                    >
                        <Icon size={3} name={iconName} alt={title} />
                    </Button>
                </Tooltip>
            ))}
        </div>
    );
};

export default Buttons;
