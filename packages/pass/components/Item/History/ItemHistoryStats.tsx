import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { epochToRelativeDate } from '@proton/pass/utils/time/format';

type Props = {
    handleHistoryClick: () => void;
    createTime: number;
    modifyTime: number;
    lastUseTime?: MaybeNull<number>;
};

export const ItemHistoryStats: FC<Props> = ({ createTime, modifyTime, lastUseTime, handleHistoryClick }) => {
    const passPlan = useSelector(selectPassPlan);

    return (
        <div className="flex flex-column border rounded-xl px-4 py-3 gap-3">
            {lastUseTime !== undefined && (
                <CardContent
                    icon="magic-wand"
                    ellipsis
                    title={c('Title').t`Last autofill`}
                    subtitle={
                        // translator: when this login was last used
                        lastUseTime ? epochToRelativeDate(lastUseTime) : c('Info').t`Never`
                    }
                />
            )}

            <CardContent
                icon="pencil"
                title={c('Title').t`Last modified`}
                subtitle={epochToRelativeDate(modifyTime)}
                ellipsis
            />

            <CardContent
                icon="bolt"
                title={c('Title').t`Created`}
                subtitle={epochToRelativeDate(createTime)}
                ellipsis
            />

            {isPaidPlan(passPlan) && (
                <Button onClick={handleHistoryClick} className="mt-1" color="weak" shape="solid" fullWidth pill>
                    {c('Action').t`View item history`}
                </Button>
            )}
        </div>
    );
};
