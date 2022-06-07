import { classnames } from '@proton/components';
import { Conversation } from '../../models/conversation';

import './NumMessages.scss';

interface Props {
    conversation: Conversation | undefined;
    className?: string;
}

const NumMessages = ({ conversation, className }: Props) => {
    // ContextNumMessages should not be used
    const { NumMessages = 0 } = conversation || {};

    if (NumMessages <= 1) {
        return null;
    }

    return (
        <span
            className={classnames([
                'number-elements flex-align-items-center lh100 text-sm inline-flex px0-25 rounded-sm ml0-25 flex-item-noshrink',
                className,
            ])}
        >
            {NumMessages}
        </span>
    );
};

export default NumMessages;
