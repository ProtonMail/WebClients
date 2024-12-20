import { type FC, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { AsyncModalState } from '@proton/pass/hooks/useAsyncModalHandles';
import { usePasswordGenerator } from '@proton/pass/hooks/usePasswordGenerator';
import { passwordOptionsEdit } from '@proton/pass/store/actions';
import { selectOrganizationPasswordGeneratorPolicy } from '@proton/pass/store/selectors';

import type { PasswordGeneratorModalState } from './PasswordContext';
import { usePasswordContext } from './PasswordContext';
import { PasswordGenerator } from './PasswordGenerator';

type Props = AsyncModalState<PasswordGeneratorModalState> & {
    onClose: () => void;
    onSubmit?: (password: string) => void;
};

export const PasswordGeneratorModal: FC<Props> = ({ onSubmit, onClose, actionLabel, className, open }) => {
    const dispatch = useDispatch();
    const { config, history } = usePasswordContext();
    const policy = useSelector(selectOrganizationPasswordGeneratorPolicy);

    const passwordGenerator = usePasswordGenerator({
        initial: config,
        onConfigChange: (next) => dispatch(passwordOptionsEdit(next)),
        policy,
    });

    const handleActionClick = useCallback(() => onSubmit?.(passwordGenerator.password), [passwordGenerator, onSubmit]);

    useEffect(() => {
        /* regenerate on each modal opening */
        if (open) passwordGenerator.regeneratePassword();
    }, [open]);

    return (
        <SidebarModal open={open} onClose={onClose} className={className}>
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
                                onClick={onClose}
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
