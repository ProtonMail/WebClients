import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, SimpleDropdown, ToolbarButton } from '@proton/components';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import clsx from '@proton/utils/clsx';

const { DAY, WEEK, MONTH, CUSTOM } = VIEWS;

interface Props {
    range: number;
    loading?: boolean;
    disabled?: boolean;
    view: VIEWS;
    onChange: (value: VIEWS) => void;
}
const ViewSelector = ({ range, loading = false, disabled = false, view, onChange, ...rest }: Props) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY, testId: 'day' },
        { text: c('Calendar view').t`Week`, value: WEEK, testId: 'week' },
        { text: c('Calendar view').t`Month`, value: MONTH, testId: 'month' },
        // { text: c('Calendar view').t`Year`, value: YEAR },
        // { text: c('Calendar view').t`Agenda`, value: AGENDA },
    ];

    const selectedOption = options.find((option) => option.value === view);

    return (
        <>
            <SimpleDropdown
                as={ToolbarButton}
                content={range === 0 ? selectedOption?.text : c('Calendar view').t`Custom`}
                title={c('Calendar view selector').t`Change time range`}
                originalPlacement="bottom-start"
                {...rest}
            >
                <DropdownMenu>
                    {options.map(({ text, value, testId }) => {
                        const v = range ? CUSTOM : value;
                        return (
                            <DropdownMenuButton
                                key={value}
                                title={c('Calendar view selector').t`Change time range to`}
                                disabled={loading || disabled}
                                className={clsx(['color-inherit text-left', v === view && 'is-active'])}
                                aria-pressed={v === view ? true : undefined}
                                onClick={() => onChange(value)}
                                data-testid={`view-option-${testId}`}
                            >
                                {text}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </>
    );
};

export default ViewSelector;
