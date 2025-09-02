import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';

import type { PasswordModalProps } from './PasswordModal';

export const SSOReauthModal: FC<PasswordModalProps> = ({ loading, open, reauth, onClose, onReauth }) => {
    const online = useConnectivity();

    if (!reauth) return null;
    const { fork, ...payload } = reauth;

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => (reauth ? onReauth?.(payload, fork) : onClose?.())}
            open={open}
            size="small"
        >
            <ModalTwoHeader title={c('Title').t`Confirm identity`} closeButtonProps={{ pill: true }} />
            <ModalTwoContent>
                <Card className="mb-4 text-sm" type="primary">
                    {c('Info').t`For security reasons, this action requires identity verification.`}
                </Card>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" shape="outline" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" color="norm" loading={loading} disabled={!online}>
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
