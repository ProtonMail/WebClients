import type { VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { selectPasswordHistory } from '@proton/pass/store';
import { passwordHistoryClear } from '@proton/pass/store/actions/creators/pw-history';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { PasswordHistoryItem } from './PasswordHistoryItem';

export const PasswordHistoryModal: VFC<ModalProps> = (props) => {
    const dispatch = useDispatch();
    const pwHistory = useSelector(selectPasswordHistory);

    return (
        <SidebarModal {...props}>
            <Panel
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
                                <Icon className="modal-close-icon" name="chevron-left" alt={c('Action').t`Back`} />
                            </Button>,
                            <Button
                                pill
                                color="norm"
                                className="text-sm flex-item-noshrink"
                                onClick={() => dispatch(passwordHistoryClear())}
                            >
                                {c('Action').t`Clear`}
                            </Button>,
                        ]}
                    />
                }
            >
                {pwHistory.length > 0 ? (
                    <div>
                        <div className={'flex flex-nowrap flex-column gap-1'}>
                            {pwHistory.map((entry) => (
                                <PasswordHistoryItem key={entry.id} {...entry} />
                            ))}
                        </div>
                        <div className="color-weak text-center px-8 mt-12">
                            <div className="color-weak text-sm">{c('Info')
                                .t`Passwords older than 1 day are automatically deleted from history.`}</div>
                        </div>
                    </div>
                ) : (
                    <div className="color-weak text-center px-8 mt-12">
                        <h6 className="text-rg text-semibold color-weak block mb-1">{c('Label').t`No history`}</h6>
                        <div className="color-weak text-sm">{c('Info')
                            .t`Passwords generated from ${PASS_APP_NAME} will be stored for a period of one day.`}</div>
                    </div>
                )}
            </Panel>
        </SidebarModal>
    );
};
