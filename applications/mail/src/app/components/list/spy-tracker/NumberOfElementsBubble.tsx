import { classnames } from '@proton/components';
import './NumberOfElementsBubble.scss';

interface Props {
    numberOfElements: number;
    className?: string;
}

const NumberOfElementsBubble = ({ numberOfElements, className, ...rest }: Props) => {
    return (
        <span
            {...rest}
            className={classnames([
                className,
                'number-of-elements-icon-bubble bg-primary rounded50 text-center text-sm m0 lh130',
                numberOfElements > 9 && 'item-spy-tracker-icon-bubble--9plus',
            ])}
        >
            {numberOfElements > 9 ? '9+' : numberOfElements}
        </span>
    );
};

export default NumberOfElementsBubble;
