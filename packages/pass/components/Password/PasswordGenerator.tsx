import type { FC17 } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import type { UsePasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';
import {
    getCharsGroupedByColor,
    isUsingMemorablePassword,
    isUsingRandomPassword,
} from '@proton/pass/hooks/usePasswordGenerator';

import { PasswordMemorableOptions } from './PasswordMemorableOptions';
import { PasswordRandomOptions } from './PasswordRandomOptions';
import { PasswordTypeSelect } from './PasswordTypeSelect';

export const PasswordGenerator: FC17<UsePasswordGeneratorResult> = (props) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="flex-column flex gap-y-2">
            <div className="my-4 px-4 py-2 flex items-center">
                <span
                    className="text-2xl text-center text-break-all text-monospace m-auto min-h-custom"
                    style={{ '--min-h-custom': '4.5rem' }}
                >
                    {getCharsGroupedByColor(props.password)}
                </span>
            </div>

            <PasswordTypeSelect {...props} />
            <hr className="m-0" />
            {isUsingRandomPassword(props) && <PasswordRandomOptions advanced={showAdvanced} {...props} />}
            {isUsingMemorablePassword(props) && <PasswordMemorableOptions advanced={showAdvanced} {...props} />}

            <hr className="m-0" />

            <div className="flex justify-end">
                <Button shape="ghost" onClick={() => setShowAdvanced((advanced) => !advanced)}>
                    <span className="flex items-center color-weak text-sm">
                        <Icon name={showAdvanced ? 'cross' : 'cog-wheel'} className="mr-1" />
                        {showAdvanced ? c('Action').t`Close advanced options` : c('Action').t`Advanced options`}
                    </span>
                </Button>
            </div>
        </div>
    );
};
