import { classnames } from '../../helpers';
import './Backdrop.scss';

const Backdrop = ({ exiting }: { exiting: boolean }) => {
    const backdropClassName = classnames(['modal-two-backdrop', exiting && 'modal-two-backdrop--out']);

    return <div className={backdropClassName} />;
};

export default Backdrop;
