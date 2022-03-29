import { c } from 'ttag';
import { classnames, generateUID } from '../../helpers';

export type Size = 'small' | 'medium' | 'large';

interface Props {
    size?: Size;
    className?: string;
}

const CircleLoader = ({ size, className }: Props) => {
    const uid = generateUID('circle-loader');

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={classnames(['circle-loader', size && `is-${size}`, className])}
                viewBox="0 0 16 16"
            >
                <defs>
                    <circle id={uid} cx="8" cy="8" r="7" />
                </defs>
                <use href={`#${uid}`} className="circle-loader-track" />
                <use href={`#${uid}`} className="circle-loader-circle" />
            </svg>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </>
    );
};

export default CircleLoader;
