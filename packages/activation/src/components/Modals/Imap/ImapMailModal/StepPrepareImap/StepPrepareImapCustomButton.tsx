import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

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
                    <IcExclamationCircleFilled size={5} className="ml-2 color-danger" />
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
