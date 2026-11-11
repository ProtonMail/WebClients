import type { MouseEvent, ReactNode } from 'react';

import type { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import clsx from '@proton/utils/clsx';

import type { Element } from '../../models/element';
import OneTimeCodeCopyButton from '../onetimecode/OneTimeCodeCopyButton';
import { OneTimeCodeLocation } from '../onetimecode/oneTimeCodeEvents';
import { useOneTimeCodeCopy } from '../onetimecode/useOneTimeCodeCopy';

/** A list row that passed the one-time code gate; `code` is null when its subject carries none. */
export interface ListOneTimeCode {
    code: string | null;
    gateSource: OtpGateSource;
}

interface Props {
    code: string;
    codeContent: ReactNode;
    element: Element;
    gateSource: OtpGateSource;
    compact?: boolean;
    className?: string;
}

/**
 * Message-list wrapper around the shared one-time-code copy button. Stops click
 * propagation so copying the code does not open the email, and hands the copy
 * to `useOneTimeCodeCopy`, which reports it and may move the email to Trash.
 */
const ItemOneTimeCode = ({ code, codeContent, element, gateSource, compact, className }: Props) => {
    const { movesToTrash, onCopy } = useOneTimeCodeCopy();

    return (
        <OneTimeCodeCopyButton
            code={code}
            codeContent={codeContent}
            compact={compact}
            className={clsx('stop-propagation', className)}
            movesToTrash={movesToTrash}
            onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
            onCopy={() => {
                onCopy([element], OneTimeCodeLocation.LIST, gateSource);
            }}
        />
    );
};

export default ItemOneTimeCode;
