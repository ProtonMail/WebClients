import clsx from '@proton/utils/clsx';

import './NumberOfElementsBubble.scss';

interface Props {
    numberOfElements: number;
    className?: string;
}

const NumberOfElementsBubble = ({ numberOfElements, className, ...rest }: Props) => {
    return (
        <span
            {...rest}
            className={clsx([
                className,
                'number-of-elements-icon-bubble bg-primary rounded-50 text-center text-sm m0 lh130',
                numberOfElements > 9 && 'number-of-elements-icon-bubble--9plus',
            ])}
        >
            {numberOfElements > 9 ? '9+' : numberOfElements}
        </span>
    );
};

export default NumberOfElementsBubble;
