import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { getHostname } from '@proton/components/helpers/url';
import { PROTON_DOMAINS } from '@proton/shared/lib/constants';
import { isSubDomain } from '@proton/shared/lib/helpers/url';

import { MessageSegments } from './MessageSegments/MessageSegments';
import { OpenLinkModal } from './OpenLinkModal/OpenLinkModal';

// Simple URL regex - matches http:// or https:// followed by non-whitespace characters
const URL_REGEX = /https:\/\/[^\s<]+[^<.,:;"')\]\s]/g;

const validateUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
            return { valid: false, url };
        }

        return { valid: true, url: parsedUrl.href };
    } catch {
        return { valid: false, url };
    }
};

interface LinkifiedTextProps {
    text: string;
    onLinkClick: (url: string) => void;
}

const LinkifiedText = ({ text, onLinkClick }: LinkifiedTextProps) => {
    const parts = text.split(URL_REGEX);
    const matches = text.match(URL_REGEX) || [];

    return (
        <>
            {parts.map((part, i) => {
                if (i === parts.length - 1) {
                    return part;
                }

                const url = matches[i];
                const { valid, url: validatedUrl } = validateUrl(url);

                if (!valid || !validatedUrl) {
                    return (
                        <span key={`part-${i}`}>
                            {part}
                            {c('Info').t`-Removed dangerous URL-`}
                        </span>
                    );
                }

                const isProtonUrl = PROTON_DOMAINS.some((domain) => isSubDomain(getHostname(validatedUrl), domain));

                return (
                    <span key={`part-${i}`}>
                        {part}
                        {isProtonUrl ? (
                            <a
                                href={validatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-focus align-baseline text-left"
                            >
                                {validatedUrl}
                                <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                            </a>
                        ) : (
                            <InlineLinkButton onClick={() => onLinkClick(validatedUrl)}>
                                {validatedUrl}
                            </InlineLinkButton>
                        )}
                    </span>
                );
            })}
        </>
    );
};

interface ChatMessageContentProps {
    message: string;
}

export const ChatMessageContent = ({ message }: ChatMessageContentProps) => {
    const [currentLink, setCurrentLink] = useState<string | null>(null);

    return (
        <>
            <MessageSegments
                message={message}
                renderText={(text) => <LinkifiedText text={text} onLinkClick={setCurrentLink} />}
            />
            {!!currentLink && <OpenLinkModal link={currentLink} onClose={() => setCurrentLink(null)} />}
        </>
    );
};
