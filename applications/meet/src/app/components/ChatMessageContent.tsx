// src/app/components/ChatItem/ChatMessageContent.tsx
import { c } from 'ttag';

import { sanitizeURL } from '@proton/pass/utils/url/sanitize';

// Simple URL regex - matches http:// or https:// followed by non-whitespace characters
const URL_REGEX = /https:\/\/[^\s<]+[^<.,:;"')\]\s]/g;

interface ChatMessageContentProps {
    message: string;
}

export const ChatMessageContent = ({ message }: ChatMessageContentProps) => {
    const parts = message.split(URL_REGEX);
    const matches = message.match(URL_REGEX) || [];

    return (
        <>
            {parts.map((part, i) => {
                if (i === parts.length - 1) {
                    return <span key={`text-${i}`}>{part}</span>;
                }

                const url = matches[i];
                const { valid, url: sanitizedUrl } = sanitizeURL(url);

                return (
                    <>
                        <span key={`text-${i}`}>{part}</span>
                        {valid && sanitizedUrl ? (
                            <a
                                key={`link-${i}`}
                                href={sanitizedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="link text-no-decoration color-primary"
                            >
                                {sanitizedUrl}
                            </a>
                        ) : (
                            <span key={`invalid-${i}`}>{c('l10n_nightly Info').t`<Removed dangerous URL>`}</span>
                        )}
                    </>
                );
            })}
        </>
    );
};
