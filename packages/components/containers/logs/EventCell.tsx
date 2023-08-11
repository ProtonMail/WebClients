import { AuthLog, AuthLogStatus } from '@proton/shared/lib/authlog';

import { Icon } from '../../components';

interface Props {
    description: AuthLog['Description'];
    status: AuthLog['Status'];
}

const getIcon = (status: AuthLogStatus) => {
    switch (status) {
        case AuthLogStatus.Attempt:
            return <Icon className="align-text-bottom color-warning" name="exclamation-circle-filled" />;
        case AuthLogStatus.Failure:
            return <Icon className="align-text-bottom color-danger" name="cross-circle-filled" />;
    }
    return <Icon className="align-text-bottom color-success" name="checkmark-circle-filled" />;
};

const EventCell = ({ description, status }: Props) => {
    return (
        <div className="inline-flex">
            <span className="flex-item-noshrink mr-2">{getIcon(status)}</span>
            <span className="flex-item-fluid">{description}</span>
        </div>
    );
};

export default EventCell;
