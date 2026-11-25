import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getAbuseURL } from '@proton/shared/lib/helpers/url';

import { purifyMessage } from '../../components/purifyMessage';

interface Props {
    message?: string;
    open: boolean;
    onClose: () => void;
}

const AbuseModal = ({ message, open, onClose }: Props) => {
    const contactLink = (
        <Href href={getAbuseURL()} key={1}>
            {c('Info').t`here`}
        </Href>
    );

    return (
        <Prompt
            open={open}
            title={c('Title').t`Account suspended`}
            onClose={onClose}
            buttons={<Button onClick={onClose}>{c('Action').t`Close`}</Button>}
        >
            {message ? (
                purifyMessage(message)
            ) : (
                <>
                    <div className="mb-4">{c('Info')
                        .t`This account has been suspended due to a potential policy violation.`}</div>
                    <div>{c('Info').jt`If you believe this is in error, please contact us ${contactLink}.`}</div>
                </>
            )}
        </Prompt>
    );
};

export default AbuseModal;
