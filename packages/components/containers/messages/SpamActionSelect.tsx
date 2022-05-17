import { c } from 'ttag';
import { SpamAction } from '@proton/shared/lib/interfaces';

import { Option, SelectTwo } from '../../components';

interface Props {
    onChange: (spamAction: SpamAction | null) => void;
    value: SpamAction | null;
    id?: string;
    loading?: boolean;
}

const SpamActionSelect = ({ onChange, ...rest }: Props) => {
    return (
        <SelectTwo onChange={({ value }) => onChange(value as SpamAction | null)} {...rest}>
            <Option title={c('Option').t`Ask me each time`} value={null} />
            <Option title={c('Option').t`Move to Spam`} value={SpamAction.JustSpam} />
            <Option title={c('Option').t`Move to Spam and unsubscribe`} value={SpamAction.SpamAndUnsub} />
        </SelectTwo>
    );
};

export default SpamActionSelect;
