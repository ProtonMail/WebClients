import { classnames } from '../../helpers';
import CircleLoader from './CircleLoader';

interface Props {
    size?: 'small' | 'medium' | 'big';
    className?: string;
}

const Loader = ({ size = 'small', className = 'center flex mb2 mt2' }: Props) => {
    return (
        <div className={className}>
            <CircleLoader className={classnames(['mauto', `is-${size}`])} />
        </div>
    );
};

export default Loader;
