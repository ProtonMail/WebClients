import { AuthLog } from '@proton/shared/lib/authlog';

interface Props {
    device: AuthLog['Device'];
}

const DeviceCell = ({ device }: Props) => {
    return <span className="flex-item-fluid">{device || '-'}</span>;
};

export default DeviceCell;
