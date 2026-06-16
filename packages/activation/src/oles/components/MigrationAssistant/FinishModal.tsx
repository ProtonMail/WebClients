import type { FC } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import DNSGroupRecords, { type DNSGroup } from '../MigrationSetup/DNSGroupRecords';
import allSetGraphic from '../all-set.svg';

import './FinishModal.scss';

type FinishModalView = 'warning' | 'instructions' | 'all-set';

const FinishModal: FC<{
    initialView?: FinishModalView;
    onFinalize?: () => Promise<void>;
    modalProps: ModalStateProps;
}> = ({ initialView = 'instructions', onFinalize, modalProps }) => {
    const [loading, withLoading] = useLoading();

    const [view, setView] = useState<FinishModalView>(initialView);

    const handleSaveAndExit = async () => {
        await withLoading(onFinalize?.());
        setView('all-set');
    };

    const WarningContent = () => (
        <>
            <ModalTwoHeader title={c('BOSS').t`Some accounts are not claimed`} />
            <ModalTwoContent>
                <p className="mt-0 mb-4 color-weak">{c('BOSS')
                    .t`We've noticed some users have not claimed their ${BRAND_NAME} accounts.`}</p>
                <p className="mt-0 mb-4 color-weak">{c('BOSS')
                    .t`Are you sure you want to proceed? Users who haven't claimed their account before the migration is finalized will need to request a password reset from their ${BRAND_NAME} organization administrator.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button loading={loading} color="norm" onClick={handleSaveAndExit}>
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </>
    );

    const InstructionsContent = () => {
        const group: DNSGroup = {
            name: 'MX',
            hideState: true,
            records: [
                {
                    dnsType: 'MX',
                    value: 'mail.protonmail.ch',
                    priority: 10,
                    state: 'invalid',
                },
                {
                    dnsType: 'MX',
                    value: 'mailsec.protonmail.ch',
                    priority: 20,
                    state: 'invalid',
                },
            ],
        };

        return (
            <>
                <ModalTwoHeader title={c('BOSS').t`Update records for receiving`} />
                <ModalTwoContent className="pb-8">
                    <p className="mt-0 mb-4 color-weak">{c('BOSS')
                        .t`Once we have confirmed that emails are routed to ${BRAND_NAME} the migration will be finalized. You will receive a confirmation email to let you know when this happens. This process can take up to 24 hours.`}</p>
                    <p className="mt-0 mb-4 color-weak">
                        {c('BOSS').t`Copy the below code and paste it in the DNS section of your domain host.`}
                    </p>

                    <DNSGroupRecords group={group} />
                </ModalTwoContent>
            </>
        );
    };

    const DoneContent = () => (
        <>
            <ModalTwoHeader />
            <ModalTwoContent>
                <img
                    width={189}
                    height={189}
                    src={allSetGraphic}
                    alt=""
                    className="block mx-auto oles-finish-modal-check"
                />
                <h3 className="text-bold text-2xl text-center my-4">{c('BOSS').t`You're all set!`}</h3>
                <p className="mt-0 mb-4 color-weak text-center">{c('BOSS')
                    .t`Once we have confirmed that emails are routed to ${BRAND_NAME} the migration will be finalized. You will receive a confirmation email to let you know when this happens. This process can take up to 24 hours.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button className="w-full" onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </>
    );

    return (
        <ModalTwo {...modalProps} size="small">
            {view === 'warning' && <WarningContent />}
            {view === 'instructions' && <InstructionsContent />}
            {view === 'all-set' && <DoneContent />}
        </ModalTwo>
    );
};

export default FinishModal;
