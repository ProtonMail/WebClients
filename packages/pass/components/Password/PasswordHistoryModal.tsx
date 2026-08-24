import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import clsx from '@proton/utils/clsx';

import { MAX_PASSWORD_HISTORY_RETENTION_WEEKS } from '../../constants';
import { selectPasswordHistory } from '../../store/selectors';
import { SidebarModal } from '../Layout/Modal/SidebarModal';
import { Panel } from '../Layout/Panel/Panel';
import { PanelHeader } from '../Layout/Panel/PanelHeader';
import { usePasswordHistoryActions } from './PasswordHistoryActionsContext';
import { PasswordHistoryItem } from './PasswordHistoryItem';

export const PasswordHistoryModal: FC<ModalProps> = (props) => {
    const { clear } = usePasswordHistoryActions();
    const history = useSelector(selectPasswordHistory);
    const empty = history.length === 0;

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
                                <IcChevronLeft className="modal-close-icon" alt={c('Action').t`Back`} />
                            </Button>,
                            <Button
                                key="clear-modal-button"
                                pill
                                color="norm"
                                className="text-sm shrink-0"
                                onClick={clear}
                            >
                                {c('Action').t`Clear`}
                            </Button>,
                        ]}
                    />
                }
            >
                <div className={'flex flex-nowrap flex-column gap-1'}>
                    {history.map((entry) => (
                        <PasswordHistoryItem key={entry.id} {...entry} />
                    ))}

                    <div className={clsx('color-weak text-center px-8', empty ? 'mt-10' : 'mt-1 mb-2')}>
                        {empty && <h6 className="text-rg text-semibold mb-1">{c('Label').t`No history`}</h6>}
                        <div className="text-sm">
                            {empty
                                ? c('Info').ngettext(
                                      msgid`Generated passwords will be stored for a period of ${MAX_PASSWORD_HISTORY_RETENTION_WEEKS} week.`,
                                      `Generated passwords will be stored for a period of ${MAX_PASSWORD_HISTORY_RETENTION_WEEKS} weeks.`,
                                      MAX_PASSWORD_HISTORY_RETENTION_WEEKS
                                  )
                                : c('Info').ngettext(
                                      msgid`Passwords older than ${MAX_PASSWORD_HISTORY_RETENTION_WEEKS} week are automatically deleted from history.`,
                                      `Passwords older than ${MAX_PASSWORD_HISTORY_RETENTION_WEEKS} weeks are automatically deleted from history.`,
                                      MAX_PASSWORD_HISTORY_RETENTION_WEEKS
                                  )}
                        </div>
                    </div>
                </div>
            </Panel>
        </SidebarModal>
    );
};
