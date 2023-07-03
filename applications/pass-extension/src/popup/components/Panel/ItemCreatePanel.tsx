import type { FC, ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ItemType } from '@proton/pass/types';

import { itemTypeToSubThemeClassName } from '../../../shared/theme/sub-theme';
import { DiscardableModalPanel, type DiscardableModalProps } from './DiscardableModalPanel';
import { PanelHeader } from './Header';
import { Panel } from './Panel';

type Props = {
    type: ItemType;
    formId: string;
    valid: boolean;
    handleCancelClick: () => void;
    renderSubmitButton?: ReactElement;
} & Omit<DiscardableModalProps, 'onDiscard'>;

function getItemTypeSubmitButtonLabel(type: ItemType) {
    switch (type) {
        case 'login':
            return c('Action').t`Create login`;
        case 'alias':
            return c('Action').t`Create alias`;
        case 'note':
            return c('Action').t`Create note`;
        default:
            return c('Action').t`Create`;
    }
}

export const ItemCreatePanel: FC<Props> = ({
    type,
    formId,
    valid,
    discardable,
    handleCancelClick,
    renderSubmitButton,
    children,
}) => (
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
                            renderSubmitButton || (
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
                                    {getItemTypeSubmitButtonLabel(type)}
                                </Button>
                            ),
                        ]}
                    />
                }
            >
                {children(props)}
            </Panel>
        )}
    </DiscardableModalPanel>
);
