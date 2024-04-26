import { InputButton, InputButtonProps, Tooltip } from '@proton/components';
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
                    labelProps={{ className: clsx('mt-2', disabled && 'pointer-events-none') }}
                    ButtonLikeProps={{ className: 'px-0' }}
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
