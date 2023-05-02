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
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
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
            >
                <DropdownMenu>
                    {options.map(({ text, value }) => {
                        const v = range ? CUSTOM : value;
                        return (
                            <DropdownMenuButton
                                key={value}
                                title={c('Calendar view selector').t`Change time range to`}
                                disabled={loading || disabled}
                                className={clsx(['color-inherit text-left', v === view && 'is-active'])}
                                aria-pressed={v === view ? true : undefined}
                                onClick={() => onChange(value)}
                                {...rest}
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
