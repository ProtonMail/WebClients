import { type FC, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { usePasswordGenerator } from '@proton/pass/hooks/usePasswordGenerator';
import { passwordOptionsEdit } from '@proton/pass/store/actions';

import { usePasswordContext } from './PasswordContext';
import { PasswordGenerator } from './PasswordGenerator';

export type BaseProps = {
    actionLabel?: string;
    className?: string;
    onSubmit?: (password: string) => void;
};

type Props = Omit<ModalProps, 'onSubmit'> & BaseProps;

export const PasswordGeneratorModal: FC<Props> = ({ onSubmit, actionLabel, ...props }) => {
    const dispatch = useDispatch();
    const { config, history } = usePasswordContext();

    const passwordGenerator = usePasswordGenerator({
        initial: config,
        onConfigChange: (next) => dispatch(passwordOptionsEdit(next)),
    });

    const handleActionClick = useCallback(() => onSubmit?.(passwordGenerator.password), [passwordGenerator, onSubmit]);

    useEffect(() => {
        /* regenerate on each modal opening */
        if (props.open) passwordGenerator.regeneratePassword();
    }, [props.open]);

    return (
        <SidebarModal {...props}>
            <Panel
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
                            <div className="flex gap-1" key="modal-actions-group">
                                {actionLabel && (
                                    <Button onClick={handleActionClick} color="norm" pill className="text-sm">
                                        {actionLabel}
                                    </Button>
                                )}
                                <Button
                                    icon
                                    pill
                                    shape="solid"
                                    className="shrink-0"
                                    onClick={passwordGenerator.regeneratePassword}
                                >
                                    <Icon name="arrows-rotate" alt={c('Action').t`Regenerate`} />
                                </Button>
                            </div>,
                        ]}
                    />
                }
            >
                <PasswordGenerator {...passwordGenerator} />

                <hr className="my-2" />

                <button className="w-full flex items-center justify-space-between" onClick={history.open}>
                    <span>{c('Label').t`Password history`}</span>
                    <Icon name="chevron-right" />
                </button>
            </Panel>
        </SidebarModal>
    );
};
