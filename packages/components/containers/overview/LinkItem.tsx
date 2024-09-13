import { Link } from 'react-router-dom';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import { Tooltip } from '../../components';

interface Props {
    to: string;
    text?: string;
    available?: boolean;
}
const LinkItem = ({ to, text, available }: Props) => {
    return (
        <Link to={to}>
            <span className="mr-2">{text}</span>
            {available ? null : (
                <Tooltip title={c('Tag').t`Premium feature`}>
                    <Icon name="star-filled" className="color-warning" />
                </Tooltip>
            )}
        </Link>
    );
};

export default LinkItem;
