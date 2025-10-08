import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import createContactImg from '@proton/pass/assets/alias/alias-contact-create.svg';
import fromToImg from '@proton/pass/assets/alias/alias-contact-from-to.png';
import stampedLetter from '@proton/pass/assets/alias/alias-contact-stamped-letter.svg';
import { Counter } from '@proton/pass/components/Layout/Badge/Counter';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import './AliasContactsMoreInfo.scss';

type AliasContactStep = { description: ReactNode; img?: string; alt?: string };

const getSteps = (): AliasContactStep[] => {
    const exampleEmail = (
        <span key="alias-sender-example" style={{ color: 'var(--interaction-norm-major-2)' }}>
            test.43jp2@simplelogin.com
        </span>
    );

    return [
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
            description: c('Info')
                .jt`Email this address and it will appear to be sent from ${exampleEmail} for example.`,
            img: fromToImg,
            alt: c('Info').t`Email headers illustration`,
        },
    ];
};

export const AliasContactsMoreInfo: FC<Pick<ModalStateProps, 'onClose'>> = ({ onClose }) => (
    <SidebarModal className="ui-teal" onClose={onClose} open>
        <Panel
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
                            className="pass-alias-contacts--image w-full h-custom overflow-hidden"
                            style={{
                                '--h-custom': '10rem',
                                'background-image': `url("${stampedLetter}")`,
                            }}
                        />,
                    ]}
                />
            }
            unstyled
        >
            <div>
                <h2 className="text-xl text-bold mt-3">{c('Title').t`Alias contacts`}</h2>
                <p className="text-lg">
                    {c('Info')
                        .t`To keep your personal email address hidden, you can create an alias contact that masks your address.`}
                </p>
                <p className="text-lg">{c('Info').t`Here's how it works:`}</p>
                {getSteps().map(({ description, img, alt }, idx) => (
                    <div key={`contact-step-${idx}`} className="mb-6">
                        <div className="flex items-center justify-center flex-nowrap gap-2">
                            <Counter>{idx + 1}</Counter>
                            <hr className="w-full mt-4" />
                        </div>
                        <div className="px-3">
                            <p className="mb-3">{description}</p>
                            {img && (
                                <img
                                    src={img}
                                    alt={alt}
                                    className="w-full max-w-custom"
                                    style={{ '--max-w-custom': '20rem' }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    </SidebarModal>
);
