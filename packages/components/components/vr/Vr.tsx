import { classnames } from '../../helpers';

export interface Props {
    className?: string;
}

// Vr for Vertical Rule
const Vr = ({ className = '', ...rest }: Props) => {
    return <span className={classnames(['vr', className])} {...rest} />;
};

export default Vr;
