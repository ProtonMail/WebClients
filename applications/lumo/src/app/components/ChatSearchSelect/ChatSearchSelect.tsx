import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

import type { ChatSearchReach } from '../../types';

interface Props {
    id?: string;
    value: ChatSearchReach;
    onChange: (value: ChatSearchReach) => void;
    /** In a project the middle option is that project's chats; in settings it applies to every project. */
    context: 'settings' | 'project';
}

export const ChatSearchSelect = ({ id, value, onChange, context }: Props) => (
    <SelectTwo<ChatSearchReach> id={id} value={value} onChange={({ value: next }) => onChange(next)}>
        <Option value="none" title={c('collider_2025: Option').t`Off`} />
        <Option
            value="project"
            title={
                context === 'project'
                    ? c('collider_2025: Option').t`This project`
                    : c('collider_2025: Option').t`Same project only`
            }
        />
        <Option value="all" title={c('collider_2025: Option').t`All chats`} />
    </SelectTwo>
);
