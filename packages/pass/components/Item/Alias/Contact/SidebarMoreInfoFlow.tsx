import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateProps } from '@proton/components';
import stampedLetter from '@proton/pass/assets/alias/alias-contact-stamped-letter.svg';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';

export const SidebarMoreInfoFlow: FC<ModalStateProps> = ({ open, onClose }) => {
    return (
        <SidebarModal className="ui-teal" onClose={onClose} open={open}>
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
            </Panel>
        </SidebarModal>
    );
};
