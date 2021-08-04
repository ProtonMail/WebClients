import { c } from 'ttag';
import { Badge, LoaderIcon } from '../../../components';
import { Status } from './interface';

interface Props {
    type: Status;
    tooltip?: string;
}
const MissingKeysStatus = ({ type, tooltip }: Props) => {
    if (type === Status.QUEUED) {
        return <Badge type="default">{c('Info').t`Queued`}</Badge>;
    }

    if (type === Status.DONE) {
        return <Badge type="success">{c('Info').t`Done`}</Badge>;
    }

    if (type === Status.FAILURE) {
        return <Badge type="error" tooltip={tooltip}>{c('Error').t`Error`}</Badge>;
    }

    if (type === Status.LOADING) {
        return <LoaderIcon />;
    }
    return null;
};

export default MissingKeysStatus;
