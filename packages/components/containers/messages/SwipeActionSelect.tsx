import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import { SWIPE_ACTION } from '@proton/shared/lib/mail/mailSettings';

import { SelectTwo } from '../../components';

export interface SwipeActionSelectProps {
    onChange: (swipeAction: SWIPE_ACTION) => void;
    value: SWIPE_ACTION;
    id?: string;
    loading?: boolean;
}

const SwipeActionSelect = ({ onChange, ...rest }: SwipeActionSelectProps) => {
    const options = [
        { title: c('Option').t`Trash`, value: SWIPE_ACTION.Trash },
        { title: c('Option').t`Spam`, value: SWIPE_ACTION.Spam },
        { title: c('Option').t`Star`, value: SWIPE_ACTION.Star },
        { title: c('Option').t`Archive`, value: SWIPE_ACTION.Archive },
        { title: c('Option').t`Mark as read`, value: SWIPE_ACTION.MarkAsRead },
    ];
    return (
        <SelectTwo onChange={({ value }) => onChange(value)} {...rest}>
            {options.map(({ title, value }) => (
                <Option key={value} title={title} value={value} />
            ))}
        </SelectTwo>
    );
};

export default SwipeActionSelect;
