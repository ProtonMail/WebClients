import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';
import clsx from '@proton/utils/clsx';

import type { QuickSettingsReminders } from './interface';

interface Props {
    reminder: QuickSettingsReminders;
}

const QuickSettingsReminder = ({ reminder }: Props) => {
    return (
        <button
            type="button"
            key={reminder.text}
            className={clsx(!!reminder.icon && 'px-3', 'py-2 hover:text-underline')}
            onClick={reminder.callback}
        >
            <span className="flex items-center gap-2">
                {reminder.icon && (
                    <span className={clsx('flex shrink-0', reminder.color && `color-${reminder.color}`)}>
                        <reminder.icon alt={c('Action').t`Attention required`} />
                    </span>
                )}
                <span
                    className={clsx(
                        'flex-1 text-left text-ellipsis',
                        reminder.color === ThemeColor.Danger && 'color-danger'
                    )}
                >
                    {reminder.text}
                </span>
            </span>
        </button>
    );
};

export default QuickSettingsReminder;
