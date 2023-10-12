import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import type { ItemType } from '@proton/pass/types';

import { DiscardableModalPanel, type DiscardableModalProps } from './DiscardableModalPanel';
import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    type: ItemType;
    formId: string;
    valid: boolean;
    handleCancelClick: () => void;
} & Omit<DiscardableModalProps, 'onDiscard'>;

export const ItemEditPanel: FC<Props> = ({ type, formId, valid, discardable, handleCancelClick, children }) => (
    <DiscardableModalPanel onDiscard={handleCancelClick} discardable={discardable}>
        {(props) => (
            <Panel
                className={itemTypeToSubThemeClassName[type]}
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="cancel-button"
                                icon
                                pill
                                shape="solid"
                                color="weak"
                                onClick={() => (discardable ? handleCancelClick() : props.confirm())}
                                title={c('Action').t`Cancel`}
                            >
                                <Icon name="cross" alt={c('Action').t`Cancel`} />
                            </Button>,
                            <Button
                                className="text-sm"
                                key="submit-button"
                                pill
                                shape="solid"
                                color="norm"
                                type="submit"
                                form={formId}
                                disabled={!valid}
                            >
                                {c('Action').t`Save`}
                            </Button>,
                        ]}
                    />
                }
            >
                {children(props)}
            </Panel>
        )}
    </DiscardableModalPanel>
);
