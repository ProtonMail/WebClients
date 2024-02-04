import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import type { Member } from '@proton/shared/lib/interfaces';

import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, SettingsLink } from '../../components';
import AdministratorList from './AdministratorList';

interface Props extends Omit<ModalProps, 'buttons' | 'title' | 'children'> {
    onResetKeys: () => void;
    disableResetOrganizationKeys: boolean;
    otherAdminsWithKeyAccess: Member[];
}

const ReactivatePasswordlessOrganizationKey = ({
    onResetKeys,
    otherAdminsWithKeyAccess,
    disableResetOrganizationKeys,
    ...rest
}: Props) => {
    return (
        <ModalTwo open {...rest}>
            <ModalTwoHeader title={c('Title').t`Restore administrator privileges`} {...rest} />
            <ModalTwoContent>
                {(() => {
                    if (otherAdminsWithKeyAccess.length) {
                        return (
                            <AdministratorList
                                loading={false}
                                members={otherAdminsWithKeyAccess.map((member) => ({
                                    member,
                                    email: member.Addresses?.[0]?.Email || member.Name,
                                }))}
                                expandByDefault={true}
                            >
                                {c('passwordless')
                                    .t`Use a data recovery method, contact another administrator, or reset the organization key to restore administrator privileges.`}
                            </AdministratorList>
                        );
                    }

                    return (
                        <div>{c('passwordless')
                            .t`Use a data recovery method or reset the organization key to restore administrator privileges.`}</div>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <div>
                    <Button
                        color="danger"
                        className="mr-4"
                        onClick={() => {
                            rest.onClose?.();
                            onResetKeys();
                        }}
                    >{c('Action').t`Reset keys`}</Button>
                    <ButtonLike color="norm" as={SettingsLink} path="/recovery" onClick={rest.onClose}>
                        {c('Action').t`Recover data`}
                    </ButtonLike>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReactivatePasswordlessOrganizationKey;
