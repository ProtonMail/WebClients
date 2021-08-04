import { c } from 'ttag';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
}
const CircleLoader = ({ className }: Props) => {
    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={classnames(['circle-loader', className])}
                viewBox="0 0 200 200"
            >
                <circle cx="100" cy="100" r="70" className="circle-loader-track" />
                <circle cx="100" cy="100" r="70" className="circle-loader-circle" />
            </svg>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </>
    );
};

export default CircleLoader;
