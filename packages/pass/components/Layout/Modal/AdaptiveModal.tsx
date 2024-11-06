import type { PropsWithChildren } from 'react';
import { type FC, type ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import clsx from '@proton/utils/clsx';

import { PassModal } from './PassModal';
import { SidebarModal } from './SidebarModal';

import './AdaptiveModal.scss';

export type AdapativeModalProps = Omit<ModalProps, 'children'> & {
    actions?: ReactNode[];
    /** only used when in `overlay` mode to show a
     * close button defaults to true. */
    closable?: boolean;
    type?: 'overlay' | 'sidebar';
};

/** The AdaptiveModal dynamically adjusts its presentation based on the client environment.
 * When accessed through the extension, it renders as a sidebar modal - on web, it takes the
 * form of a conventional modal, relocating quick actions to the footer. */
export const AdaptiveModal: FC<PropsWithChildren<AdapativeModalProps>> = ({
    actions = [],
    children,
    closable = true,
    content,
    size,
    type,
    ...props
}) => {
    const { endpoint } = usePassCore();

    return type === 'overlay' || endpoint === 'web' || endpoint === 'desktop' ? (
        <PassModal {...props} size={size} className="text-center">
            {closable && <ModalTwoHeader closeButtonProps={{ pill: true, icon: true }} />}
            <ModalTwoContent className={clsx(!closable && 'pt-4')}>{children}</ModalTwoContent>
            <ModalTwoFooter className="pass-modal--actions flex flex-column justify-center">{actions}</ModalTwoFooter>
        </PassModal>
    ) : (
        <SidebarModal {...props} className="text-center">
            <Panel
                className="text-center"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="shrink-0"
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
