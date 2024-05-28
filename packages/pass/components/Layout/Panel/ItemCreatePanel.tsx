import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useSaveShortcut } from '@proton/pass/hooks/useSaveShortcut';
import type { ItemType, MaybeNull } from '@proton/pass/types';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { DiscardableModalPanel, type DiscardableModalProps } from './DiscardableModalPanel';
import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    type: ItemType;
    formId: string;
    valid: boolean;
    handleCancelClick: () => void;
    submitButton?: ReactNode;
    actions?: ReactNode;
} & Omit<DiscardableModalProps, 'onDiscard'>;

function getItemTypeSubmitButtonLabel(type: ItemType) {
    switch (type) {
        case 'login':
            return c('Action').t`Create login`;
        case 'alias':
            return c('Action').t`Create alias`;
        case 'note':
            return c('Action').t`Create note`;
        case 'creditCard':
            return c('Action').t`Create card`;
        default:
            return c('Action').t`Create`;
    }
}

export const ItemCreatePanel = ({
    discardable,
    formId,
    submitButton,
    type,
    valid,
    children,
    handleCancelClick,
    actions,
}: Props) => {
    useSaveShortcut(() => {
        if (valid && !discardable) {
            const form = document.getElementById(formId) as MaybeNull<HTMLFormElement>;
            form?.requestSubmit();
        }
    });

    return (
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
                                <div key="actions" className="flex flex-nowrap gap-2">
                                    {actions}
                                    {submitButton || (
                                        <Tooltip
                                            key="submit-button"
                                            openDelay={500}
                                            originalPlacement={'bottom'}
                                            title={
                                                <>
                                                    <Kbd shortcut={metaKey} /> + <Kbd shortcut="S" />
                                                </>
                                            }
                                        >
                                            <Button
                                                className="text-sm"
                                                pill
                                                shape="solid"
                                                color="norm"
                                                type="submit"
                                                form={formId}
                                                disabled={!valid}
                                            >
                                                {getItemTypeSubmitButtonLabel(type)}
                                            </Button>
                                        </Tooltip>
                                    )}
                                </div>,
                            ]}
                        />
                    }
                >
                    {children(props)}
                </Panel>
            )}
        </DiscardableModalPanel>
    );
};
