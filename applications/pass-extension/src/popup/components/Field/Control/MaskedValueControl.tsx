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
import type { ValueControlProps } from './ValueControl';
import { ValueControl } from './ValueControl';

export type MaskedValueControlProps = {
    as?: ValueControlProps['as'];
    charsGroupedByColor?: boolean;
    icon?: IconName;
    label: string;
    value: string;
};

export const MaskedValueControl: VFC<MaskedValueControlProps> = ({
    as,
    charsGroupedByColor = false,
    icon,
    label,
    value,
}) => {
    const [masked, setMasked] = useState(true);
    const isEmpty = isEmptyString(value);

    const maskedValue = useMemo(() => {
        if (isEmpty) {
            return <div className="color-weak">{c('Info').t`None`}</div>;
        }
        if (masked) {
            return '••••••••••••••••';
        } else {
            return charsGroupedByColor ? getCharsGroupedByColor(value) : value;
        }
    }, [masked, value]);

    return (
        <ClickToCopyValueControl value={value}>
            <ValueControl
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
                as={as}
                icon={icon ?? 'key'}
                interactive={!isEmpty}
                label={label}
                valueClassName={clsx(!isEmpty && (masked || charsGroupedByColor) && 'text-monospace')}
            >
                {maskedValue}
            </ValueControl>
        </ClickToCopyValueControl>
    );
};
