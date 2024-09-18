import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Checkbox from '@proton/components/components/input/Checkbox';
import { useNotifications } from '@proton/components/hooks';
import { isEdge, isIE11 } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Label } from '../../label';

interface Props {
    link: string;
    isPunnyCoded: boolean;
    value: boolean;
    onToggle: () => void;
    isOutside: boolean;
}

const LinkConfirmationModalLink = ({ link, isPunnyCoded, value, onToggle, isOutside = false }: Props) => {
    const { createNotification } = useNotifications();
    const isMSBrowser = isEdge() || isIE11();
    const handleCopy = () => {
        createNotification({
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    return (
        <>
            {`${c('Info').t`You are about to open another browser tab and visit:`} `}
            <span className="text-bold text-break">{link}</span>
            <Copy
                className="ml-2"
                size="small"
                tooltipText={c('Info').t`Copy the link to clipboard`}
                value={link}
                onCopy={handleCopy}
            />

            {isPunnyCoded && (
                <p className="my-2">
                    {isMSBrowser
                        ? c('Info')
                              .t`This link may be a homograph attack and cannot be opened by the Edge browser. If you are certain the link is legitimate, please use a different browser to open it.`
                        : c('Info')
                              .t`This link may be a homograph attack. Please verify this is the link you wish to visit, or don't open it.`}
                    <Href
                        className="ml-1"
                        href={getKnowledgeBaseUrl('/homograph-attacks')}
                        title="What are homograph attacks?"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </p>
            )}

            {!isOutside && (
                <Label className="flex">
                    <Checkbox checked={value} onChange={onToggle} className="mr-2" />
                    {c('Label').t`Don't ask again`}
                </Label>
            )}
        </>
    );
};

export default LinkConfirmationModalLink;
