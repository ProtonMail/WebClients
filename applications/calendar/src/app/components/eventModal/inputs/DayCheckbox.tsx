import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { InputButtonProps } from '@proton/components/components/input/InputButton';
import InputButton from '@proton/components/components/input/InputButton';
import clsx from '@proton/utils/clsx';

interface Props extends Omit<InputButtonProps, 'title'> {
    id: string;
    dayLong: string;
    dayAbbreviation: string;
    disabled?: boolean;
}

const DayCheckbox = ({ id, dayAbbreviation, dayLong, disabled = false, ...rest }: Props) => {
    return (
        <Tooltip title={dayLong}>
            <div className={clsx(disabled && 'cursor-default')}>
                <InputButton
                    labelProps={{ className: clsx(disabled && 'pointer-events-none') }}
                    ButtonLikeProps={{ className: clsx('px-0 border-none', !rest.checked && 'bg-weak') }}
                    {...rest}
                >
                    <span aria-hidden="true">{dayAbbreviation}</span>
                    <span className="sr-only">{dayLong}</span>
                </InputButton>
            </div>
        </Tooltip>
    );
};

export default DayCheckbox;
