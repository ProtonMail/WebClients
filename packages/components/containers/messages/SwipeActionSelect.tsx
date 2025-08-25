import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { SWIPE_ACTION } from '@proton/shared/lib/mail/mailSettings';

export interface SwipeActionSelectProps {
    onChange: (swipeAction: SWIPE_ACTION) => void;
    value: SWIPE_ACTION;
    id?: string;
    loading?: boolean;
}

const getSwipeOptions = () =>
    Object.freeze([
        { title: c('Option').t`None`, value: SWIPE_ACTION.None },
        { title: c('Option').t`Trash`, value: SWIPE_ACTION.Trash },
        { title: c('Option').t`Spam`, value: SWIPE_ACTION.Spam },
        { title: c('Option').t`Star`, value: SWIPE_ACTION.Star },
        { title: c('Option').t`Archive`, value: SWIPE_ACTION.Archive },
        { title: c('Option').t`Mark as read`, value: SWIPE_ACTION.MarkAsRead },
        { title: c('Option').t`Label as...`, value: SWIPE_ACTION.LabelAs },
        { title: c('Option').t`Move to...`, value: SWIPE_ACTION.MoveTo },
    ]);

const SwipeActionSelect = ({ onChange, ...rest }: SwipeActionSelectProps) => {
    const swipeOptions = getSwipeOptions();
    return (
        <SelectTwo onChange={({ value }) => onChange(value)} {...rest}>
            {swipeOptions.map(({ title, value }) => (
                <Option key={value} title={title} value={value} />
            ))}
        </SelectTwo>
    );
};

export default SwipeActionSelect;
