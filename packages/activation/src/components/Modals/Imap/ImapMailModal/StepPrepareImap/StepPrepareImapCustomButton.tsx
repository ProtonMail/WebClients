import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';

interface Props {
    isLabelMapping: boolean;
    handleClickCustomize: () => void;
    handleReset: () => void;
    hasError: boolean;
    isCustom: boolean;
}

const StepPrepareCustomButton = ({ isLabelMapping, handleClickCustomize, handleReset, hasError, isCustom }: Props) => {
    return (
        <div className="mt-2 flex items-center">
            <Button shape="outline" onClick={handleClickCustomize} data-testid="StepPrepare:customizeButton">
                {c('Action').t`Customize import`}
            </Button>
            {hasError && (
                <Tooltip title={EasyTrans.get(isLabelMapping).editName()} originalPlacement="right">
                    <Icon name="exclamation-circle-filled" size={5} className="ml-2 color-danger" />
                </Tooltip>
            )}
            {isCustom && (
                <InlineLinkButton className="ml-4" onClick={handleReset}>
                    {c('Action').t`Reset to default`}
                </InlineLinkButton>
            )}
        </div>
    );
};

export default StepPrepareCustomButton;
