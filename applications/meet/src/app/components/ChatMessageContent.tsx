import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
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

    const handleLinkClick = (link: string) => {
        const hostName = getHostname(link);
        if (PROTON_DOMAINS.some((domain) => isSubDomain(hostName, domain))) {
            const otherWindow = window.open();
            if (otherWindow) {
                otherWindow.location.href = link;
            }

            return;
        }

        setCurrentLink(link);
    };

    return (
        <>
            {parts.map((part, i) => {
                if (i === parts.length - 1) {
                    return part;
                }

                const url = matches[i];
                const { valid, url: validatedUrl } = validateUrl(url);

                return (
                    <>
                        {part}
                        {valid && validatedUrl ? (
                            <InlineLinkButton key={`link-${i}`} onClick={() => handleLinkClick(validatedUrl)}>
                                {validatedUrl}
                            </InlineLinkButton>
                        ) : (
                            <>{c('Info').t`<Removed dangerous URL>`}</>
                        )}
                    </>
                );
            })}
            {!!currentLink && <OpenLinkModal link={currentLink} onClose={() => setCurrentLink(null)} />}
        </>
    );
};
