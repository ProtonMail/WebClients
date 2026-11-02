import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

import type { ChatSearchReach } from '../../types';

interface Props<Value> {
    id?: string;
    value: Value;
    onChange: (value: Value) => void;
    /** In a project "same project" reads as that project; in settings it applies to every project. */
    context: 'settings' | 'project';
}

const sameProjectLabel = (context: 'settings' | 'project') =>
    context === 'project'
        ? c('collider_2025: Option').t`This project`
        : c('collider_2025: Option').t`Same project only`;

export const ChatSearchSelect = ({ id, value, onChange, context }: Props<ChatSearchReach>) => (
    <SelectTwo<ChatSearchReach> id={id} value={value} onChange={({ value: next }) => onChange(next)}>
        <Option value="none" title={c('collider_2025: Option').t`Off`} />
        <Option value="project" title={sameProjectLabel(context)} />
        <Option value="all" title={c('collider_2025: Option').t`All chats`} />
    </SelectTwo>
);

/** Whether files of other projects can be looked up: true is all projects. */
export const FileSearchSelect = ({ id, value, onChange, context }: Props<boolean>) => (
    <SelectTwo<boolean> id={id} value={value} onChange={({ value: next }) => onChange(next)}>
        <Option value={false} title={sameProjectLabel(context)} />
        <Option value={true} title={c('collider_2025: Option').t`All projects`} />
    </SelectTwo>
);
