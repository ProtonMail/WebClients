import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';

type Props = {
    createTime: number;
    lastUseTime?: MaybeNull<number>;
    modifyTime: number;
    handleHistoryClick: () => void;
};

export const ItemHistoryStats: FC<Props> = ({ createTime, lastUseTime, modifyTime, handleHistoryClick }) => {
    const passPlan = useSelector(selectPassPlan);

    return (
        <div className="flex flex-column border border-weak rounded-xl px-4 py-3 gap-3">
            {lastUseTime !== undefined && (
                <CardContent
                    icon="magic-wand"
                    iconProps={{ size: 4 }}
                    ellipsis
                    title={c('Title').t`Last autofill`}
                    subtitle={
                        // translator: when this login was last used
                        lastUseTime ? epochToRelativeDaysAgo(lastUseTime) : c('Info').t`Never`
                    }
                />
            )}

            <CardContent
                icon="pencil"
                iconProps={{ size: 4 }}
                title={c('Title').t`Last modified`}
                subtitle={epochToRelativeDaysAgo(modifyTime)}
                ellipsis
            />

            <CardContent
                icon="bolt"
                iconProps={{ size: 4 }}
                title={c('Title').t`Created`}
                subtitle={epochToRelativeDaysAgo(createTime)}
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
