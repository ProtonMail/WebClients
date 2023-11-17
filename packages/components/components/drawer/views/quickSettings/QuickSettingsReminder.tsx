import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ThemeColor } from '@proton/colors/types';
import { Icon } from '@proton/components/components';
import { QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import clsx from '@proton/utils/clsx';

interface Props {
    reminder: QuickSettingsReminders;
}

const QuickSettingsReminder = ({ reminder }: Props) => {
    return (
        <Button key={reminder.text} shape="ghost" fullWidth className="py-2 px-3" onClick={reminder.callback}>
            <span className="flex items-center gap-2">
                {reminder.icon && (
                    <span className={clsx('flex flex-item-noshrink', reminder.color && `color-${reminder.color}`)}>
                        <Icon name={reminder.icon} alt={c('Action').t`Attention required`} />
                    </span>
                )}
                <span
                    className={clsx(
                        'flex-item-fluid text-left text-ellipsis',
                        reminder.color === ThemeColor.Danger && 'color-danger'
                    )}
                >
                    {reminder.text}
                </span>
            </span>
        </Button>
    );
};

export default QuickSettingsReminder;
