import { InputButton, InputButtonProps } from '@proton/components';

interface Props extends Omit<InputButtonProps, 'title'> {
    id: string;
    dayLong: string;
    dayAbbreviation: string;
}

const DayCheckbox = ({ id, dayAbbreviation, dayLong, ...rest }: Props) => {
    return (
        <InputButton title={dayLong} labelProps={{ className: 'mt0-5' }} {...rest}>
            <span aria-hidden="true">{dayAbbreviation}</span>
            <span className="sr-only">{dayLong}</span>
        </InputButton>
    );
};

export default DayCheckbox;
