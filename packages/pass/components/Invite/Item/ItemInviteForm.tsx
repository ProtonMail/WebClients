import { forwardRef, useMemo } from 'react';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { InviteStepMembers } from '@proton/pass/components/Invite/Steps/InviteStepMembers';
import { InviteStepPermissions } from '@proton/pass/components/Invite/Steps/InviteStepPermissions';
import { InviteStepReview } from '@proton/pass/components/Invite/Steps/InviteStepReview';
import type { InviteAddressValidator } from '@proton/pass/hooks/invite/useAddressValidator';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import type { SelectAccessDTO } from '@proton/pass/store/selectors';
import { selectAccessMembers } from '@proton/pass/store/selectors';
import type { ItemInviteFormValues, MaybeNull } from '@proton/pass/types';

import { ItemInviteHeader } from './ItemInviteHeader';

export const FORM_ID = 'item-invite';

type Props = {
    autoFocus?: boolean;
    form: FormikContextType<ItemInviteFormValues>;
    validator: MaybeNull<InviteAddressValidator>;
};

export const ItemInviteForm = forwardRef<HTMLInputElement, Props>(({ form, autoFocus, validator }, fieldRef) => {
    const { step, members, shareId, itemId } = form.values;
    const access = useMemo<SelectAccessDTO>(() => ({ shareId, itemId }), [shareId, itemId]);
    const excluded = useMemoSelector(selectAccessMembers, [shareId, itemId]);

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
                    onUpdate={(next) => form.setFieldValue('members', next)}
                />
            )}

            {step === 'permissions' && (
                <InviteStepPermissions
                    members={members}
                    onUpdate={(next) => form.setFieldValue('members', next)}
                    onStep={(next) => form.setFieldValue('step', next)}
                />
            )}

            {step === 'review' && (
                <InviteStepReview
                    heading={<ItemInviteHeader shareId={shareId} itemId={itemId} />}
                    members={members}
                    title={c('Title').t`Item`}
                />
            )}
        </>
    );
});

ItemInviteForm.displayName = 'ItemInviteFormForwarded';
