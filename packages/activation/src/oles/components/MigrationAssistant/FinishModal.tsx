import { useState } from 'react';
import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';
import { Href } from '@proton/atoms/Href/Href';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import Copy from '@proton/components/components/button/Copy';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const mailDomain = 'mail.protonmail.ch';
const mailsecDomain = 'mailsec.protonmail.ch';

type FinishModalView = 'warning' | 'instructions' | 'all-set';

const FinishModal: FC<{
    initialView?: FinishModalView;
    onFinalize: () => Promise<void>;
    modalProps: ModalStateProps;
}> = ({ initialView = 'instructions', onFinalize, modalProps }) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [confirmed, setConfirmed] = useState(false);
    const [view, setView] = useState<FinishModalView>(initialView);

    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });

    const handleSaveAndExit = async () => {
        await withLoading(onFinalize());
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
                <Button color="norm" onClick={() => setView('instructions')}>
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </>
    );

    const InstructionsContent = () => (
        <>
            <ModalTwoHeader title={c('BOSS').t`Update records for receiving`} />
            <ModalTwoContent>
                <p className="mt-0 mb-4 color-weak">
                    {c('BOSS')
                        .t`Finalizing the migration means all your emails will be routed directly to ${BRAND_NAME}. Users will stop receiving emails on their Google accounts and data will not be synchronized between ${BRAND_NAME} and Google anymore.`}
                </p>

                <p className="mt-0 mb-4 color-weak">
                    {c('BOSS').t`Please add the following records in your DNS console of your domain provider:`}
                </p>

                <div className="mb-2">
                    <CircledNumber number={1} className="mr-2" />
                    <span className="text-semibold">{c('Label').t`MX records`}</span>
                </div>

                <BorderedContainer className="mb-3">
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >
                            MX
                        </span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span className="text-ellipsis overflow-hidden">{mailDomain}</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value={mailDomain}
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >{c('Label').t`Host name`}</span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span>@</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value="@"
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >{c('Label').t`Priority`}</span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span>10</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value="10"
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                </BorderedContainer>

                <BorderedContainer className="mb-4">
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >
                            MX
                        </span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span className="text-ellipsis overflow-hidden">{mailsecDomain}</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value={mailsecDomain}
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >{c('Label').t`Host name`}</span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span>@</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value="@"
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                    <BorderedContainerItem className="flex items-center gap-4">
                        <span
                            className="text-semibold shrink-0 text-ellipsis overflow-hidden"
                            style={{ minWidth: '5rem', maxWidth: '5rem' }}
                        >{c('Label').t`Priority`}</span>
                        <div className="flex items-center justify-space-between gap-2 flex-1 overflow-hidden">
                            <span>20</span>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value="20"
                                onCopy={handleCopy}
                                size="small"
                                className="shrink-0"
                            />
                        </div>
                    </BorderedContainerItem>
                </BorderedContainer>

                <Href href={getKnowledgeBaseUrl('/custom-domain')}>{c('Link').t`Detailed instructions`} &rsaquo;</Href>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Checkbox
                    id="confirm-mx-records"
                    className="items-center"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                >
                    {c('Label').t`Confirm MX records added`}
                </Checkbox>
                <Button color="norm" disabled={!confirmed} loading={loading} onClick={handleSaveAndExit}>
                    {c('Action').t`Save & exit`}
                </Button>
            </ModalTwoFooter>
        </>
    );

    const DoneContent = () => (
        <>
            <ModalTwoHeader title={c('BOSS').t`You're all set!`} />
            <ModalTwoContent>
                <p className="mt-0 mb-4 color-weak">{c('BOSS')
                    .t`Once we have confirmed that emails are routed to ${BRAND_NAME} the migration will be finalized. You will receive a confirmation email to let you know when this happens. This process can take up to 24 hours.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </>
    );

    return (
        <ModalTwo {...modalProps}>
            {view === 'warning' && <WarningContent />}
            {view === 'instructions' && <InstructionsContent />}
            {view === 'all-set' && <DoneContent />}
        </ModalTwo>
    );
};

export default FinishModal;
