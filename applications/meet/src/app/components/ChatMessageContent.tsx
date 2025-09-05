import { c } from 'ttag';

// Simple URL regex - matches http:// or https:// followed by non-whitespace characters
const URL_REGEX = /https:\/\/[^\s<]+[^<.,:;"')\]\s]/g;

const validateUrl = (url: string) => {
    try {
        return { valid: true, url: new URL(url).href };
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
                            <a
                                key={`link-${i}`}
                                href={validatedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="link text-no-decoration color-primary"
                            >
                                {validatedUrl}
                            </a>
                        ) : (
                            <>{c('Info').t`<Removed dangerous URL>`}</>
                        )}
                    </>
                );
            })}
        </>
    );
};
