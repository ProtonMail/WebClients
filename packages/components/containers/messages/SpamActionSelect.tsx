import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import { SelectTwo } from '../../components';

interface Props {
    onChange: (spamAction: SPAM_ACTION | null) => void;
    value: SPAM_ACTION | null;
    id?: string;
    loading?: boolean;
}

const SpamActionSelect = ({ onChange, ...rest }: Props) => {
    return (
        <SelectTwo onChange={({ value }) => onChange(value as SPAM_ACTION | null)} {...rest}>
            <Option title={c('Option').t`On`} value={SPAM_ACTION.JustSpam} />
            <Option title={c('Option').t`Off`} value={SPAM_ACTION.SpamAndUnsub} />
            <Option title={c('Option').t`Ask each time`} value={null} />
        </SelectTwo>
    );
};

export default SpamActionSelect;
