import type { VFC } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { isEmptyString } from '@proton/pass/utils/string';
import clsx from '@proton/utils/clsx';

import { getCharsGroupedByColor } from '../../../../shared/hooks/usePasswordGenerator';
import { ClickToCopyValueControl } from './ClickToCopyValueControl';
import { ValueControl } from './ValueControl';

type Props = {
    icon?: IconName;
    label?: string;
    password: string;
};

export const PasswordValueControl: VFC<Props> = ({ icon, label, password }) => {
    const [masked, setMasked] = useState(true);
    const isEmpty = isEmptyString(password);

    const passwordDisplay = useMemo(() => {
        if (isEmpty) {
            return <div className="color-weak">{c('Info').t`None`}</div>;
        }

        return (
            <div className={clsx('text-monospace', masked && 'user-select-none')}>
                {masked ? '••••••••••••••••••' : getCharsGroupedByColor(password)}
            </div>
        );
    }, [masked, password]);

    return (
        <ClickToCopyValueControl value={password}>
            <ValueControl
                interactive={!isEmpty}
                actions={
                    !isEmpty
                        ? [
                              <Button
                                  icon
                                  pill
                                  color="weak"
                                  onClick={() => setMasked((prev) => !prev)}
                                  size="medium"
                                  shape="solid"
                                  title={masked ? c('Action').t`Unmask password` : c('Action').t`Mask password`}
                              >
                                  <Icon size={20} name={masked ? 'eye' : 'eye-slash'} />
                              </Button>,
                          ]
                        : []
                }
                icon={icon ?? 'key'}
                label={label ?? c('Label').t`Password`}
            >
                {passwordDisplay}
            </ValueControl>
        </ClickToCopyValueControl>
    );
};
