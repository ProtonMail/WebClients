import { forwardRef, useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import type { InviteAddressValidator } from '../../../hooks/invite/useAddressValidator';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { type AccessKeys, AccessTarget } from '../../../lib/access/types';
import { selectAccessMembers } from '../../../store/selectors/access';
import { selectItem } from '../../../store/selectors/items';
import type { InviteFormMemberItem, InviteFormStep, ItemInviteFormValues } from '../../../types/forms/invite';
import type { MaybeNull } from '../../../types/utils';
import { InviteStepMembers } from '../Steps/InviteStepMembers';
import { InviteStepPermissions } from '../Steps/InviteStepPermissions';
import { InviteStepReview } from '../Steps/InviteStepReview';
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
    const item = useSelector(selectItem(shareId, itemId));
    const isLoginItem = item?.data.type === 'login';

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
                    showSensitiveContentToggle={isLoginItem}
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
