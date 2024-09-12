import { Toggle } from '../../components';

interface Props {
    id?: string;
    loading?: boolean;
    nextMessageOnMove?: number;
    onToggle: (nextMessageOnMove: 1 | 0) => void;
}

const NextMessageOnMoveToggle = ({ id, nextMessageOnMove, loading, onToggle }: Props) => {
    return (
        <Toggle
            id={id}
            checked={Boolean(nextMessageOnMove)}
            onChange={({ target }) => onToggle(target.checked ? 1 : 0)}
            loading={loading}
        />
    );
};

export default NextMessageOnMoveToggle;
