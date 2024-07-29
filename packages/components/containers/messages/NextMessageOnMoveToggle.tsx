import { NEXT_MESSAGE_ON_MOVE } from '@proton/shared/lib/mail/mailSettings';

import { Toggle } from '../../components';

interface Props {
    id?: string;
    loading?: boolean;
    nextMessageOnMove?: number;
    onToggle: (nextMessageOnMove: NEXT_MESSAGE_ON_MOVE) => void;
}

const NextMessageOnMoveToggle = ({ id, nextMessageOnMove, loading, onToggle }: Props) => {
    return (
        <Toggle
            id={id}
            checked={Boolean(nextMessageOnMove)}
            onChange={({ target }) =>
                onToggle(target.checked ? NEXT_MESSAGE_ON_MOVE.ENABLED : NEXT_MESSAGE_ON_MOVE.DISABLED)
            }
            loading={loading}
        />
    );
};

export default NextMessageOnMoveToggle;
