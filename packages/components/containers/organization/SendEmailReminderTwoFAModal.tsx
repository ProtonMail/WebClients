import { c } from 'ttag';

import { Avatar, Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import { useLoading } from '@proton/hooks';
import { sendEmailReminderTwoFA } from '@proton/shared/lib/api/organization';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Address, Member, PartialMemberAddress } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    Badge,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    useFormErrors,
} from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    members: Member[];
    memberAddressesMap: { [key: string]: (Address | PartialMemberAddress)[] | undefined };
}

const SendEmailReminderTwoFAModal = ({ onClose, members, memberAddressesMap, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async () => {
        await api(sendEmailReminderTwoFA());
        await call();
        createNotification({ text: c('Notification').t`Reminder has been sent` });
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
            {...rest}
        >
            <ModalHeader title={c('Title').t`Send email reminders?`} />
            <ModalContent>
                <p>{c('Info')
                    .t`The following members will receive an email prompting them to enable two-factor authentication as soon as possible.`}</p>
                <ul className="unstyled">
                    {members
                        .filter(function (member) {
                            const memberAddresses = memberAddressesMap?.[member.ID] || [];
                            return memberAddresses.length > 0;
                        })
                        .map((member) => {
                            const memberAddresses = memberAddressesMap?.[member.ID] || [];
                            return (
                                <li className="py-2 flex flex-nowrap items-center border-bottom" title={member.Name}>
                                    <Avatar className="mr-2 shrink-0">{getInitials(member.Name)}</Avatar>
                                    <div>
                                        <div className="text-ellipsis max-100" title={member.Name}>
                                            {member.Name}
                                        </div>
                                        <div className="max-w-full flex">
                                            <span className="flex-1 mr-2 text-ellipsis">
                                                {memberAddresses[0]?.Email}
                                            </span>
                                            {member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN && (
                                                <span className="shrink-0">
                                                    <Badge type="light">{c('Admin').t`admin`}</Badge>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                </ul>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm" disabled={loading}>
                    {c('Action').t`Send reminder`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SendEmailReminderTwoFAModal;
