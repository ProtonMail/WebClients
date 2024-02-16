import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Kbd } from '@proton/atoms/Kbd';
import { Icon, Tooltip } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { metaKey } from '@proton/shared/lib/helpers/browser';

type Props = { disabled?: boolean };

export const BulkToggle: FC<Props> = ({ disabled }) => {
    const bulk = useBulkSelect();

    useEffect(() => {
        if (disabled) bulk.disable();
    }, [disabled]);

    return (
        <div className="flex flex-row flex-nowrap overflow-hidden justify-end">
            <Tooltip
                key="bulk-toggle"
                openDelay={500}
                isOpen={bulk.enabled ? false : undefined}
                originalPlacement={'bottom'}
                title={<Kbd shortcut={metaKey} />}
            >
                <Button
                    shape="solid"
                    size="small"
                    color="weak"
                    onClick={bulk[bulk.enabled ? 'disable' : 'enable']}
                    title={c('Action').t`Bulk select items`}
                    disabled={disabled}
                    className="flex gap-2 text-ellipsis text-sm text-semibold"
                >
                    {bulk.enabled ? (
                        c('Action').t`Cancel`
                    ) : (
                        <>
                            <Icon name="checkmark-triple" className="inline shrink-0" />
                            <span className="hidden md:block">{c('Action').t`Multiple select`}</span>
                        </>
                    )}
                </Button>
            </Tooltip>
        </div>
    );
};
