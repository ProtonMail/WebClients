import type { MouseEvent, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import type { Element } from '../../models/element';
import OneTimeCodeCopyButton from '../onetimecode/OneTimeCodeCopyButton';
import { useOneTimeCodeCopy } from '../onetimecode/useOneTimeCodeCopy';

interface Props {
    code: string;
    codeContent: ReactNode;
    element: Element;
    compact?: boolean;
    className?: string;
}

/**
 * Message-list wrapper around the shared one-time-code copy button. Stops click
 * propagation so copying the code does not open the email, and moves the email
 * to Trash once the code has been copied (recoverable via the automatic Undo).
 */
const ItemOneTimeCode = ({ code, codeContent, element, compact, className }: Props) => {
    const { movesToTrash, onCopy } = useOneTimeCodeCopy();

    return (
        <OneTimeCodeCopyButton
            code={code}
            codeContent={codeContent}
            compact={compact}
            className={clsx('stop-propagation', className)}
            movesToTrash={movesToTrash}
            onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
            onCopy={() => onCopy([element])}
        />
    );
};

export default ItemOneTimeCode;
