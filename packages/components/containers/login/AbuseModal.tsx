import DOMPurify from 'dompurify';
import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { isElement } from '@proton/shared/lib/helpers/dom';
import { getAbuseURL } from '@proton/shared/lib/helpers/url';

import { Prompt } from '../../components';

interface Props {
    message?: string;
    open: boolean;
    onClose: () => void;
}

const sanitize = (msg: string) => {
    const sanitizedElement = DOMPurify.sanitize(msg, {
        RETURN_DOM: true,
        ALLOWED_TAGS: ['b', 'a', 'i', 'em', 'strong', 'br', 'p', 'span'],
        ALLOWED_ATTR: ['href'],
    });

    sanitizedElement.querySelectorAll('a').forEach((node) => {
        if (node.tagName === 'A') {
            node.setAttribute('rel', 'noopener noreferrer');
            node.setAttribute('target', '_blank');
        }
    });

    return sanitizedElement;
};

const containsHTML = (el?: Node) => {
    return el?.childNodes && Array.from(el.childNodes).some(isElement);
};

const purifyMessage = (msg: string) => {
    const sanitizedElement = sanitize(msg);

    if (containsHTML(sanitizedElement)) {
        return <div dangerouslySetInnerHTML={{ __html: sanitizedElement.innerHTML }} />;
    }

    return <>{msg}</>;
};

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
