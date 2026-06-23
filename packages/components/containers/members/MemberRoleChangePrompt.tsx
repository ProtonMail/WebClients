import { c } from 'ttag';

import type { MemberEditPayload, MemberKeyPayload, PromoteGlobalSSOPayload } from '@proton/account';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { BRAND_NAME, MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';

const ConfirmPromotePrompt = ({
    payload,
    onResolve,
    ...modalProps
}: ModalStateProps & {
    payload: PromoteGlobalSSOPayload | MemberKeyPayload;
    onResolve: (value: boolean) => void;
}) => {
    const { member: targetMember, email } = payload;
    return (
        <Prompt
            title={c('Title').t`Change role`}
            buttons={[
                <Button color="norm" onClick={() => onResolve(true)}>
                    {c('Action').t`Make admin`}
                </Button>,
                <Button onClick={() => onResolve(false)}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
            onClose={() => onResolve(false)}
        >
            <div className="mb-2">
                {c('Info').t`Are you sure you want to give administrative privileges to this user?`}
            </div>
            <Card rounded className="text-break">
                <div className="text-bold">{targetMember.Name}</div>
                {email !== targetMember.Name && <div>{email}</div>}
            </Card>
            {payload.type === 'promote-global-sso' && (
                <div className="mt-2">
                    {c('unprivatization')
                        .t`To gain administrator rights, they will have to set a backup password the next time they sign in to ${BRAND_NAME}.`}
                </div>
            )}
        </Prompt>
    );
};

const ConfirmDemotePrompt = ({
    subscriber,
    onResolve,
    ...modalProps
}: ModalStateProps & {
    subscriber?: MEMBER_SUBSCRIBER;
    onResolve: (value: boolean) => void;
}) => {
    return (
        <Prompt
            title={c('Title').t`Change role`}
            buttons={[
                <Button color="danger" onClick={() => onResolve(true)}>
                    {c('Action').t`Remove`}
                </Button>,
                <Button onClick={() => onResolve(false)}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
            onClose={() => onResolve(false)}
        >
            {subscriber === MEMBER_SUBSCRIBER.PAYER
                ? c('Info')
                      .t`This user is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.`
                : c('Info').t`Are you sure you want to remove administrative privileges from this user?`}
        </Prompt>
    );
};

interface Props extends ModalStateProps {
    action: MemberEditPayload;
    subscriber?: MEMBER_SUBSCRIBER;
    onResolve: (value: boolean) => void;
    onReject: () => void;
}

const MemberRoleChangePrompt = ({ action, subscriber, onResolve, ...modalProps }: Props) => {
    const { classification, payload } = action;

    if (classification.kind === 'promote' && payload) {
        return <ConfirmPromotePrompt payload={payload} onResolve={onResolve} {...modalProps} />;
    }

    if (classification.kind === 'demote') {
        return <ConfirmDemotePrompt subscriber={subscriber} onResolve={onResolve} {...modalProps} />;
    }

    throw new Error(`Unexpected MemberEditPayload: ${JSON.stringify(action)}`);
};

export default MemberRoleChangePrompt;
