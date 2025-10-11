import { type FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { AsyncModalState } from '@proton/pass/hooks/useAsyncModalHandles';
import { usePasswordGenerator } from '@proton/pass/hooks/usePasswordGenerator';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/types';
import { passwordOptionsEdit } from '@proton/pass/store/actions';
import { selectOrganizationPasswordGeneratorPolicy, selectPasswordOptions } from '@proton/pass/store/selectors';

import { PasswordGenerator } from './PasswordGenerator';
import { usePasswordHistoryActions } from './PasswordHistoryActions';

export type PasswordGeneratorModalState = {
    /** Allows different themes to be applied based on the
     * context where the modal is launched */
    className?: string;
    /** When provided, displays a submit button that
     * triggers the modal's `onSubmit` callback. */
    actionLabel?: string;
};

type Props = AsyncModalState<PasswordGeneratorModalState> & {
    onClose: () => void;
    onSubmit?: (password: string) => void;
};

export const PasswordGeneratorModal: FC<Props> = ({ actionLabel, className, open, onClose, onSubmit }) => {
    const dispatch = useDispatch();
    const onConfigChange = useCallback((next: GeneratePasswordConfig) => dispatch(passwordOptionsEdit(next)), []);

    const passwordHistory = usePasswordHistoryActions();
    const config = useSelector(selectPasswordOptions, () => true);
    const policy = useSelector(selectOrganizationPasswordGeneratorPolicy);

    const generator = usePasswordGenerator({ config, policy, onConfigChange });

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
                                    <Button
                                        onClick={() => onSubmit?.(generator.password)}
                                        color="norm"
                                        pill
                                        className="text-sm"
                                    >
                                        {actionLabel}
                                    </Button>
                                )}
                                <Button
                                    icon
                                    pill
                                    shape="solid"
                                    className="shrink-0"
                                    onClick={generator.regeneratePassword}
                                >
                                    <Icon name="arrows-rotate" alt={c('Action').t`Regenerate`} />
                                </Button>
                            </div>,
                        ]}
                    />
                }
            >
                <PasswordGenerator {...generator} />

                <hr className="my-2" />

                <button className="w-full flex items-center justify-space-between" onClick={passwordHistory.open}>
                    <span>{c('Label').t`Password history`}</span>
                    <Icon name="chevron-right" />
                </button>
            </Panel>
        </SidebarModal>
    );
};
