import Icon from '@proton/components/components/icon/Icon';
import type { AuthLog } from '@proton/shared/lib/authlog';
import { AuthLogStatus } from '@proton/shared/lib/authlog';
import clsx from '@proton/utils/clsx';

interface Props {
    description: AuthLog['Description'];
    status: AuthLog['Status'];
    isB2B?: boolean;
}

const getIcon = (status: AuthLogStatus, isB2B: boolean) => {
    switch (status) {
        case AuthLogStatus.Attempt:
            return <Icon className="align-text-bottom color-warning" name="exclamation-circle-filled" />;
        case AuthLogStatus.Failure:
            return (
                <Icon
                    className="align-text-bottom color-danger"
                    name={isB2B ? 'pass-shield-fill-danger' : 'cross-circle-filled'}
                />
            );
    }
    return (
        <Icon
            className="align-text-bottom color-success"
            name={isB2B ? 'shield-2-check-filled' : 'checkmark-circle-filled'}
        />
    );
};

const EventCell = ({ description, status, isB2B = false }: Props) => {
    return (
        <div className="inline-flex">
            <span className="shrink-0 mr-2">{getIcon(status, isB2B)}</span>
            <span className={clsx('flex-1', isB2B && 'color-norm')}>{description}</span>
        </div>
    );
};

export default EventCell;
