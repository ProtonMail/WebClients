import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { Tooltip, Icon } from '../../components';

interface Props {
    to: string;
    text?: string;
    permission: boolean;
}
const LinkItem = ({ to, text, permission }: Props) => {
    return (
        <Link to={to}>
            <span className="mr0-5">{text}</span>
            {permission ? null : (
                <Tooltip title={c('Tag').t`Premium feature`}>
                    <Icon name="star-filled" className="color-warning" />
                </Tooltip>
            )}
        </Link>
    );
};

export default LinkItem;
