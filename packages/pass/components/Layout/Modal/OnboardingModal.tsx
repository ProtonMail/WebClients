import { type FC, type ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';

import { Panel } from '../Panel/Panel';
import { SidebarModal } from './SidebarModal';

import './OnboardingModal.scss';

export type SidebarModalProps = Omit<ModalProps, 'children'> & { actions?: ReactNode[] };

/** The Onboarding modal will display differently depending on the client.
 * In the extension it will render as a sidebar modal. On web it will use
 * a standard modal and move the quick actions to the footer. */
export const OnboardingModal: FC<SidebarModalProps> = ({ children, content, actions = [], size, ...props }) => {
    const { endpoint } = usePassCore();

    return endpoint === 'web' ? (
        <ModalTwo {...props} size={size} className="text-center">
            <ModalTwoHeader closeButtonProps={{ pill: true, icon: true }} />
            <ModalTwoContent className="pb-4">{children}</ModalTwoContent>
            <ModalTwoFooter className="pass-onboarding-modal--actions flex justify-center">
                {actions}
            </ModalTwoFooter>
        </ModalTwo>
    ) : (
        <SidebarModal {...props} className="text-center">
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
                            ...actions,
                        ]}
                    />
                }
            >
                {children}
            </Panel>
        </SidebarModal>
    );
};
