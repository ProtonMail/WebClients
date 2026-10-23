import { type ReactNode, useRef, useState } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import type { AccessTarget } from '../../../lib/access/types';
import { PassFeature } from '../../../types/api/features';
import type { ShareRole } from '../../../types/data/shares';
import type { InviteFormMemberItem, InviteFormStep } from '../../../types/forms/invite';
import { ConfirmationPrompt } from '../../Confirmation/ConfirmationPrompt';
import { VirtualList } from '../../Layout/List/VirtualList';
import { AccessRoleToggle } from '../Access/AccessRoleToggle';
import { InviteMember } from './InviteMember';

type Props = {
    heading?: ReactNode;
    members: InviteFormMemberItem[];
    target: AccessTarget;
    showSensitiveContentToggle?: boolean;
    onStep: (step: InviteFormStep) => Promise<void>;
    onUpdate: (members: InviteFormMemberItem[]) => Promise<void>;
};

const ROW_HEIGHT = 64;

export const InviteStepPermissions = ({
    heading,
    members,
    target,
    showSensitiveContentToggle = true,
    onStep,
    onUpdate,
}: Props) => {
    const listRef = useRef<List>(null);
    const hiddenPasswordEnabled = useFeatureFlag(PassFeature.Pass__V1_44__ShareWithHiddenPassword);
    const allowViewersToSeePasswords = members.every(({ value }) => !value.hideSensitiveContent);
    const [confirmHidePasswords, setConfirmHidePasswords] = useState(false);
    const importantBold = <strong key="important">{c('Info').t`Important:`}</strong>;

    const setHideSensitiveContent = (hideSensitiveContent: boolean) =>
        onUpdate(members.map(({ id, value }) => ({ id, value: { ...value, hideSensitiveContent } })));

    const onAllowViewersToSeePasswordsChange = (allow: boolean) => {
        if (!allow) return setConfirmHidePasswords(true);
        void setHideSensitiveContent(false);
    };

    return (
        <div className="anime-fade-in h-full flex flex-column gap-y-3 flex-nowrap *:shrink-0">
            {heading}
            <h2 className="text-xl text-bold">{c('Title').t`Set access level`}</h2>

            <div className="w-full flex flex-nowrap items-center justify-center justify-between gap-3 text-lg">
                <div className="flex-auto shrink-0">
                    <button
                        className="text-break-all text-left color-weak text-semibold"
                        onClick={() => onStep('members')}
                    >
                        {c('Title').t`Members`} ({members.length})
                    </button>
                </div>

                <AccessRoleToggle
                    onRoleChange={(role) =>
                        onUpdate(members.map(({ id, value }) => ({ id, value: { ...value, role } })))
                    }
                />
            </div>

            {hiddenPasswordEnabled && showSensitiveContentToggle && (
                <Checkbox
                    className="border border-weak rounded-lg p-3"
                    checked={allowViewersToSeePasswords}
                    onChange={(e) => onAllowViewersToSeePasswordsChange(e.target.checked)}
                >
                    <div className="flex-1">
                        <span>{c('Label').t`Allow viewers to see passwords`}</span>
                        <span className="block color-weak text-sm">
                            {c('Info').t`Viewers can still autofill. Editors and admins always see passwords.`}
                        </span>
                    </div>
                </Checkbox>
            )}

            {confirmHidePasswords && (
                <ConfirmationPrompt
                    title={c('Title').t`Hide passwords from viewers?`}
                    message={
                        <>
                            <p className="m-0">
                                {c('Info')
                                    .t`Viewers can still autofill passwords, but won't see them in ${PASS_APP_NAME}. This discourages casual viewing and reduces the risk of accidental disclosure.`}
                            </p>
                            <p className="m-0 mt-2">
                                {c('Info')
                                    .jt`${importantBold} This doesn't prevent viewers from retrieving passwords through other means.`}
                            </p>
                        </>
                    }
                    confirmText={c('Action').t`Hide passwords`}
                    onCancel={() => setConfirmHidePasswords(false)}
                    onConfirm={() => {
                        setConfirmHidePasswords(false);
                        void setHideSensitiveContent(true);
                    }}
                />
            )}

            <div
                className="flex-1 min-h-custom overflow-hidden rounded-lg"
                style={{ '--min-h-custom': `${ROW_HEIGHT * 2}px` }}
            >
                <VirtualList
                    ref={listRef}
                    rowHeight={() => ROW_HEIGHT}
                    rowRenderer={({ style, index, key }) => {
                        const member = members[index];

                        const onRemove = async () => {
                            const update = members.filter(({ id }) => id !== member.id);
                            await onUpdate(update);
                            await onStep(update.length === 0 ? 'members' : 'permissions');
                        };

                        const onRoleChange = (role: ShareRole) =>
                            onUpdate(
                                members.map(({ id, value }) => ({
                                    id,
                                    value: { ...value, role: id === member.id ? role : value.role },
                                }))
                            );

                        return (
                            <div style={style} key={key}>
                                <InviteMember
                                    {...member}
                                    target={target}
                                    key={`member-${member.id}`}
                                    onRemove={onRemove}
                                    onRoleChange={onRoleChange}
                                />
                            </div>
                        );
                    }}
                    rowCount={members.length}
                />
            </div>
        </div>
    );
};
