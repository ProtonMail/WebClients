import type { FC } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { Copy } from '@proton/components/components';
import { isEmptyString } from '@proton/pass/utils/string';

const TextFieldValue: FC<{ children: string; fallback?: string }> = ({ children, fallback }) => {
    const { createNotification } = useNotifications();
    const isNonEmpty = !isEmptyString(children);

    return (
        <div className="flex flex-nowrap flex-align-items-center">
            <div className="mr-4 text-ellipsis user-select">
                {isNonEmpty ? children : <span className="text-sm color-weak">{fallback}</span>}
            </div>
            {isNonEmpty && (
                <Copy
                    className="ml-auto flex-item-noshrink"
                    value={children}
                    onCopy={() =>
                        createNotification({
                            type: 'success',
                            text: c('Info').t`Copied to clipboard`,
                            showCloseButton: false,
                        })
                    }
                />
            )}
        </div>
    );
};

export default TextFieldValue;
