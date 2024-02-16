import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { HistoryItem } from '@proton/pass/components/Item/History/HistoryItem';
import type { MaybeNull } from '@proton/pass/types';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

type Props = {
    createTime: number;
    modifyTime: number;
    lastUseTime?: MaybeNull<number>;
    handleHistoryClick?: () => void;
};

export const ItemViewHistoryStats: FC<Props> = ({ createTime, modifyTime, lastUseTime, handleHistoryClick }) => {
    return (
        <div className="flex flex-column border rounded-xl px-4 py-3 gap-3">
            {lastUseTime !== undefined && (
                <HistoryItem
                    icon="magic-wand"
                    title={c('Title').t`Last autofill`}
                    subtitle={
                        // translator: when this login was last used
                        lastUseTime ? getFormattedDateFromTimestamp(lastUseTime) : c('Info').t`Never`
                    }
                />
            )}
            <HistoryItem
                icon="pencil"
                title={c('Title').t`Last modified`}
                subtitle={getFormattedDateFromTimestamp(modifyTime)}
            />
            <HistoryItem
                icon="bolt"
                title={c('Title').t`Created`}
                subtitle={getFormattedDateFromTimestamp(createTime)}
            />
            {handleHistoryClick && (
                <Button onClick={handleHistoryClick} className="mt-1" color="weak" shape="solid" fullWidth pill>
                    {c('Action').t`View history`}
                </Button>
            )}
        </div>
    );
};
