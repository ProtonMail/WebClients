import { Icon } from '../../../components';

interface Props {
    error: string;
}

const MergeErrorContent = ({ error }: Props) => {
    return (
        <div className="bg-warning p1">
            <Icon name="attention" className="mr1" />
            <span className="mr1">{error}</span>
        </div>
    );
};

export default MergeErrorContent;
