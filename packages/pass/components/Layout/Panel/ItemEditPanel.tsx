import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCross } from '@proton/icons/icons/IcCross';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { useSaveShortcut } from '../../../hooks/useSaveShortcut';
import type { ItemType, MaybeNull } from '../../../types';
import { itemTypeToSubThemeClassName } from '../Theme/types';
import { DiscardableModalPanel, type DiscardableModalProps } from './DiscardableModalPanel';
import { ItemFeatureDiscovery } from './ItemFeatureDiscovery/ItemFeatureDiscovery';
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
                                    <IcCross alt={c('Action').t`Cancel`} />
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
