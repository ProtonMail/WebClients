import { Icon, Tooltip } from '../../components';

interface Props {
    name: string;
    color: string;
}

const ContactGroupIcon = ({ name, color, ...rest }: Props) => {
    return (
        <Tooltip title={name}>
            <Icon name="users" color={color} {...rest} />
        </Tooltip>
    );
};

export default ContactGroupIcon;
