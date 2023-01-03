import React from 'react';

import { c } from 'ttag';

import { EasyTrans } from '@proton/activation/helpers/easyTrans';
import { Button } from '@proton/atoms/Button';
import { Icon, InlineLinkButton, Tooltip } from '@proton/components/components';

interface Props {
    isLabelMapping: boolean;
    handleClickCustomize: () => void;
    handleReset: () => void;
    hasError: boolean;
    isCustom: boolean;
}

const StepPrepareCustomButton = ({ isLabelMapping, handleClickCustomize, handleReset, hasError, isCustom }: Props) => {
    return (
        <div className="mt0-5 flex flex-align-items-center">
            <Button shape="outline" onClick={handleClickCustomize} data-testid="StepPrepare:customizeButton">
                {c('Action').t`Customize import`}
            </Button>
            {hasError && (
                <Tooltip title={EasyTrans.get(isLabelMapping).editName()} originalPlacement="right">
                    <Icon name="exclamation-circle-filled" size={20} className="ml0-5 color-danger" />
                </Tooltip>
            )}
            {isCustom && (
                <InlineLinkButton className="ml1" onClick={handleReset}>
                    {c('Action').t`Reset to default`}
                </InlineLinkButton>
            )}
        </div>
    );
};

export default StepPrepareCustomButton;
