import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateProps } from '@proton/components';
import createContactImg from '@proton/pass/assets/alias/alias-contact-create.svg';
import fromToImg from '@proton/pass/assets/alias/alias-contact-from-to.svg';
import stampedLetter from '@proton/pass/assets/alias/alias-contact-stamped-letter.svg';
import { SidebarMoreInfoFlowSection } from '@proton/pass/components/Item/Alias/Contact/SidebarMoreInfoFlowSection';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const exampleEmail = (
    <span key="alias-sender-example" style={{ color: 'var(--interaction-norm-major-2)' }}>
        test.43jp2@simplelogin.com
    </span>
);

const getSteps = () => [
    {
        description: c('Info').t`Enter the address you want to email.`,
        img: createContactImg,
        alt: c('Info').t`Create contact illustration`,
    },
    {
        description: c('Info')
            .t`${PASS_APP_NAME} will generate a forwarding address (also referred to as reverse alias) that you can copy to the clipboard.`,
    },
    {
        description: c('Info').jt`Email this address and it will appear to be sent from ${exampleEmail} for example.`,
        img: fromToImg,
        alt: c('Info').t`Email headers illustration`,
    },
];

export const SidebarMoreInfoFlow: FC<Pick<ModalStateProps, 'onClose'>> = ({ onClose }) => {
    const steps = getSteps();

    return (
        <SidebarModal className="ui-teal" onClose={onClose} open>
            <Panel
                className="pass-panel--full"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="cancel-button"
                                icon
                                pill
                                shape="solid"
                                color="weak"
                                onClick={onClose}
                                title={c('Action').t`Cancel`}
                                className="absolute top-custom left-custom"
                                style={{
                                    '--top-custom': '12px',
                                    '--left-custom': '16px',
                                }}
                            >
                                <Icon name="cross" alt={c('Action').t`Cancel`} />
                            </Button>,
                            <div
                                key="image-stamped-letter"
                                className="w-full max-h-custom overflow-hidden"
                                style={{ '--max-h-custom': '18rem', backgroundImage: stampedLetter }}
                            >
                                <img className="w-full" src={stampedLetter} alt="" />
                            </div>,
                        ]}
                    />
                }
                unstyled
            >
                <h2 className="text-xl text-bold mt-3">{c('Title').t`Alias contacts`}</h2>
                <p className="text-lg">{c('Info')
                    .t`To keep your personal email address hidden, you can create an alias contact that masks your address.`}</p>
                <p className="text-lg">{c('Info').t`Here's how it works:`}</p>
                {steps.map(({ description, img, alt }, idx) => (
                    <SidebarMoreInfoFlowSection
                        key={`contact-step-${idx}`}
                        index={`${idx + 1}`}
                        description={description}
                        img={img}
                        alt={alt}
                    />
                ))}
            </Panel>
        </SidebarModal>
    );
};
