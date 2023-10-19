import { type VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import accountImg from '@proton/pass/assets/protonpass-account.svg';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';

export type Props = Omit<ModalProps, 'onSubmit'>;

export const PendingShareAccessModal: VFC<Props> = ({ ...props }) => {
    return (
        <SidebarModal {...props}>
            <Panel
                className="text-center"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross" alt={c('Action').t`Close`} />
                            </Button>,
                        ]}
                    />
                }
            >
                <div className="flex flex-columns flex-justify-center flex-align-items-center gap-4">
                    <img src={accountImg} className="mt-4 w-1/3" alt="pending share access graphic" />
                    <h3 className="text-bold w-3/4">{c('Title').t`Pending access to the shared data`}</h3>
                    <div className="text-sm w-3/4">
                        {c('Info').t`For security reasons, your access needs to be confirmed`}
                    </div>
                </div>
            </Panel>
        </SidebarModal>
    );
};
