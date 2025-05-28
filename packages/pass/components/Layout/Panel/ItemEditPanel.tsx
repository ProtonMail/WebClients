import { c } from 'ttag';

import { Button, Kbd, Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
import { ItemFeatureDiscovery } from '@proton/pass/components/Layout/Panel/ItemFeatureDiscovery/ItemFeatureDiscovery';
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
} & Omit<DiscardableModalProps, 'onDiscard'>;

export const ItemEditPanel = ({ type, formId, valid, discardable, handleCancelClick, children }: Props) => {
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
                                        {c('Action').t`Save`}
                                    </Button>
                                </Tooltip>,
                            ]}
                        />
                    }
                >
                    <ItemFeatureDiscovery type={type} />
                    {children(props)}
                </Panel>
            )}
        </DiscardableModalPanel>
    );
};
