import { forwardRef, useMemo } from 'react';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { InviteStepMembers } from '@proton/pass/components/Invite/Steps/InviteStepMembers';
import { InviteStepPermissions } from '@proton/pass/components/Invite/Steps/InviteStepPermissions';
import { InviteStepReview } from '@proton/pass/components/Invite/Steps/InviteStepReview';
import { type InviteAddressValidator } from '@proton/pass/hooks/invite/useAddressValidator';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { type AccessKeys, AccessTarget } from '@proton/pass/lib/access/types';
import { selectAccessMembers } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { type VaultInviteFormValues } from '@proton/pass/types';

import { VaultHeading } from './VaultHeading';

export const FORM_ID = 'vault-invite';

type Props = {
    autoFocus?: boolean;
    form: FormikContextType<VaultInviteFormValues>;
    validator: MaybeNull<InviteAddressValidator>;
};

export const VaultInviteForm = forwardRef<HTMLInputElement, Props>(({ form, autoFocus, validator }, fieldRef) => {
    const { step, members, shareId } = form.values;
    const excluded = useMemoSelector(selectAccessMembers, [shareId]);
    const access = useMemo<AccessKeys>(() => ({ shareId }), [shareId]);

    return (
        <>
            {step === 'members' && (
                <InviteStepMembers
                    ref={fieldRef}
                    access={access}
                    autoFocus={autoFocus}
                    excluded={excluded}
                    heading={<VaultHeading shareId={shareId} />}
                    members={members}
                    validator={validator}
                    onUpdate={(next) => form.setFieldValue('members', next)}
                />
            )}

            {step === 'permissions' && (
                <InviteStepPermissions
                    heading={<VaultHeading shareId={shareId} />}
                    members={members}
                    target={AccessTarget.Vault}
                    onStep={(next) => form.setFieldValue('step', next)}
                    onUpdate={(next) => form.setFieldValue('members', next)}
                />
            )}

            {step === 'review' && (
                <InviteStepReview
                    heading={<VaultHeading shareId={shareId} />}
                    members={members}
                    target={AccessTarget.Vault}
                    title={c('Title').t`Vault`}
                />
            )}
        </>
    );
});

VaultInviteForm.displayName = 'VaultInviteFormForwarded';
