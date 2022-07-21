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
            <Option title={c('Option').t`On`} value={SpamAction.JustSpam} />
            <Option title={c('Option').t`Off`} value={SpamAction.SpamAndUnsub} />
            <Option title={c('Option').t`Ask each time`} value={null} />
        </SelectTwo>
    );
};

export default SpamActionSelect;
