import React from 'react';

import { c } from 'ttag';

import { isEdge, isIE11 } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Checkbox } from '../../input';
import { Label } from '../../label';
import { Href } from '../../link';

interface Props {
    link: string;
    isPunnyCoded: boolean;
    value: boolean;
    onToggle: () => void;
    isOutside: boolean;
}

const LinkConfirmationModalLink = ({ link, isPunnyCoded, value, onToggle, isOutside = false }: Props) => {
    const isMSBrowser = isEdge() || isIE11();

    return (
        <>
            {`${c('Info').t`You are about to open another browser tab and visit:`} `}
            <span className="text-bold text-break">{link}</span>

            {isPunnyCoded && (
                <>
                    {isMSBrowser
                        ? c('Info')
                              .t`This link may be a homograph attack and cannot be opened by the Edge browser. If you are certain the link is legitimate, please use a different browser to open it.`
                        : c('Info')
                              .t`This link may be a homograph attack. Please verify this is the link you wish to visit, or don't open it.`}
                    <Href url={getKnowledgeBaseUrl('/homograph-attacks')} title="What are homograph attacks?">
                        {c('Info').t`Learn more`}
                    </Href>
                </>
            )}

            {!isOutside && (
                <Label className="flex">
                    <Checkbox checked={value} onChange={onToggle} className="mr0-5" />
                    {c('Label').t`Do not ask again`}
                </Label>
            )}
        </>
    );
};

export default LinkConfirmationModalLink;
