import React from 'react';

import { c } from 'ttag';

import { getTimeUnitLabels } from '@proton/activation/constants';
import { EasyTrans } from '@proton/activation/helpers/easyTrans';
import { TIME_PERIOD } from '@proton/activation/interface';
import { Icon, LabelStack, Tooltip } from '@proton/components/components';
import { Label } from '@proton/shared/lib/interfaces';

interface Props {
    selectedPeriod: TIME_PERIOD;
    importLabel?: Pick<Label, 'Name' | 'Color' | 'Type'>;
    isLabelMapping: boolean;
    showMaxFoldersError: boolean;
    providerFoldersCount: number;
    selectedFoldersCount: number;
}

const StepPrepareContent = ({
    selectedPeriod,
    importLabel,
    isLabelMapping,
    showMaxFoldersError,
    providerFoldersCount,
    selectedFoldersCount,
}: Props) => {
    const timeUnitLabels = getTimeUnitLabels();
    const trans = EasyTrans.get(isLabelMapping);

    const providerFoldersNum = providerFoldersCount;
    const providerFoldersNumLocalized = providerFoldersNum.toLocaleString();
    const selectedFoldersCountLocalized = selectedFoldersCount.toLocaleString();

    return (
        <>
            <div className="mb1 flex flex-align-items-center">
                <Icon className="mr0-5" name="inbox" />
                {c('Info').t`Import mailbox`}
            </div>

            <div className="mb1 ml1 flex flex-align-items-center">
                <Icon className="mr0-5" name="clock" />
                {c('Label').t`Import interval`}
                {`: `}
                <strong className="ml0-5">{timeUnitLabels[selectedPeriod]}</strong>
            </div>

            <div className="mb1 ml1 flex flex-align-items-center flex-nowrap">
                <Icon className="flex-item-noshrink mr0-5" name="tag" />
                <span className="flex-item-noshrink">{c('Info').t`Label all imported messages as`}</span>
                {importLabel && (
                    <span className="ml0-5">
                        <LabelStack
                            labels={[
                                {
                                    name: importLabel.Name,
                                    color: importLabel.Color,
                                    title: importLabel.Name,
                                },
                            ]}
                            className="max-w100"
                        />
                    </span>
                )}
            </div>

            <div className="mb1 ml1 flex flex-align-items-center">
                <Icon className="mr0-5" name={isLabelMapping ? 'tags' : 'folders'} />
                {trans.foundCount(providerFoldersNumLocalized, providerFoldersNum)}

                {showMaxFoldersError && (
                    <Tooltip title={trans.errorMaxItems()} originalPlacement="right">
                        <Icon className="ml0-5 color-danger" name="exclamation-circle-filled" size={18} />
                    </Tooltip>
                )}
            </div>

            {selectedFoldersCount !== providerFoldersNum && (
                <div className="mb1 ml2 flex flex-align-items-center">
                    <strong>
                        <Icon className="mr0-5" name={isLabelMapping ? 'tags' : 'folders'} />
                        {trans.selectedCount(selectedFoldersCountLocalized, selectedFoldersCount)}
                    </strong>
                </div>
            )}
        </>
    );
};

export default StepPrepareContent;
