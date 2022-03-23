import { useRef } from 'react';
import { c } from 'ttag';
import { classnames, generateUID } from '../../helpers';

interface Props {
    className?: string;
}
const CircleLoader = ({ className }: Props) => {
    const uid = generateUID('circle-loader');
    const loaderCircle = useRef<SVGCircleElement>(null);

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={classnames(['circle-loader', className])}
                viewBox="0 0 16 16"
                style={{ '--total-length': loaderCircle.current?.getTotalLength() }}
            >
                <defs>
                    <circle ref={loaderCircle} id={uid} cx="8" cy="8" r="7" />
                </defs>
                <use href={`#${uid}`} className="circle-loader-track" />
                <use href={`#${uid}`} className="circle-loader-circle" />
            </svg>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </>
    );
};

export default CircleLoader;
