import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { getHostname } from '@proton/components/helpers/url';
import { PROTON_DOMAINS } from '@proton/shared/lib/constants';
import { isSubDomain } from '@proton/shared/lib/helpers/url';

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
interface ChatMessageContentProps {
    message: string;
}

export const ChatMessageContent = ({ message }: ChatMessageContentProps) => {
    const parts = message.split(URL_REGEX);
    const matches = message.match(URL_REGEX) || [];

    const [currentLink, setCurrentLink] = useState<string | null>(null);

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
                        <>
                            {part}
                            {c('Info').t`-Removed dangerous URL-`}
                        </>
                    );
                }

                const isProtonUrl = PROTON_DOMAINS.some((domain) => isSubDomain(getHostname(validatedUrl), domain));

                return (
                    <>
                        {part}
                        {isProtonUrl ? (
                            <a
                                key={`link-${i}`}
                                href={validatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-focus align-baseline text-left"
                            >
                                {validatedUrl}
                                <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                            </a>
                        ) : (
                            <InlineLinkButton key={`link-${i}`} onClick={() => setCurrentLink(validatedUrl)}>
                                {validatedUrl}
                            </InlineLinkButton>
                        )}
                    </>
                );
            })}
            {!!currentLink && <OpenLinkModal link={currentLink} onClose={() => setCurrentLink(null)} />}
        </>
    );
};
