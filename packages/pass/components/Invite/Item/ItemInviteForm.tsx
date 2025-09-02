import { forwardRef, useMemo } from 'react';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { InviteStepMembers } from '@proton/pass/components/Invite/Steps/InviteStepMembers';
import { InviteStepPermissions } from '@proton/pass/components/Invite/Steps/InviteStepPermissions';
import { InviteStepReview } from '@proton/pass/components/Invite/Steps/InviteStepReview';
import type { InviteAddressValidator } from '@proton/pass/hooks/invite/useAddressValidator';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { type AccessKeys, AccessTarget } from '@proton/pass/lib/access/types';
import { selectAccessMembers } from '@proton/pass/store/selectors';
import type { InviteFormMemberItem, InviteFormStep, ItemInviteFormValues, MaybeNull } from '@proton/pass/types';

import { ItemInviteHeader } from './ItemInviteHeader';

export const FORM_ID = 'item-invite';

type Props = {
    autoFocus?: boolean;
    form: FormikContextType<ItemInviteFormValues>;
    validator: MaybeNull<InviteAddressValidator>;
};

export const ItemInviteForm = forwardRef<HTMLInputElement, Props>(({ form, autoFocus, validator }, fieldRef) => {
    const { step, members, shareId, itemId } = form.values;
    const excluded = useMemoSelector(selectAccessMembers, [shareId, itemId]);
    const access = useMemo<AccessKeys>(() => ({ shareId, itemId }), [shareId, itemId]);

    const handles = useMemo(
        () => ({
            setMembers: async (next: InviteFormMemberItem[]) => {
                await form.setFieldValue('members', next);
            },
            setStep: async (next: InviteFormStep) => {
                await form.setFieldValue('step', next);
            },
        }),
        []
    );

    return (
        <>
            {step === 'members' && (
                <InviteStepMembers
                    ref={fieldRef}
                    access={access}
                    autoFocus={autoFocus}
                    excluded={excluded}
                    members={members}
                    validator={validator}
                    onUpdate={handles.setMembers}
                />
            )}

            {step === 'permissions' && (
                <InviteStepPermissions
                    members={members}
                    target={AccessTarget.Item}
                    onUpdate={handles.setMembers}
                    onStep={handles.setStep}
                />
            )}

            {step === 'review' && (
                <InviteStepReview
                    heading={<ItemInviteHeader shareId={shareId} itemId={itemId} />}
                    members={members}
                    title={c('Title').t`Item`}
                    target={AccessTarget.Item}
                />
            )}
        </>
    );
});

ItemInviteForm.displayName = 'ItemInviteFormForwarded';
