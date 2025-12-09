import { c } from 'ttag';

import { getTimeUnitLabels } from '@proton/activation/src/constants';
import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import type { TIME_PERIOD } from '@proton/activation/src/interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { LabelStack } from '@proton/components';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcTag } from '@proton/icons/icons/IcTag';
import { IcTags } from '@proton/icons/icons/IcTags';
import type { Label } from '@proton/shared/lib/interfaces';

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
            <div className="mb-4 flex items-center">
                <IcInbox className="mr-2" />
                {c('Info').t`Import mailbox`}
            </div>

            <div className="mb-4 ml-4 flex items-center">
                <IcClock className="mr-2" />
                {c('Label').t`Import interval`}
                {`: `}
                <strong className="ml-2">{timeUnitLabels[selectedPeriod]}</strong>
            </div>

            <div className="mb-4 ml-4 flex items-center flex-nowrap">
                <IcTag className="shrink-0 mr-2" />
                <span className="shrink-0">{c('Info').t`Label all imported messages as`}</span>
                {importLabel && (
                    <span className="ml-2">
                        <LabelStack
                            labels={[
                                {
                                    name: importLabel.Name,
                                    color: importLabel.Color,
                                    title: importLabel.Name,
                                },
                            ]}
                            className="max-w-full"
                        />
                    </span>
                )}
            </div>

            <div className="mb-4 ml-4 flex items-center">
                {isLabelMapping ? <IcTags className="mr-2" /> : <IcFolders className="mr-2" />}
                {trans.foundCount(providerFoldersNumLocalized, providerFoldersNum)}

                {showMaxFoldersError && (
                    <Tooltip title={trans.errorMaxItems()} originalPlacement="right">
                        <IcExclamationCircleFilled className="ml-2 color-danger" size={4.5} />
                    </Tooltip>
                )}
            </div>

            {selectedFoldersCount !== providerFoldersNum && (
                <div className="mb-4 ml-8 flex items-center">
                    <strong>
                        {isLabelMapping ? <IcTags className="mr-2" /> : <IcFolders className="mr-2" />}
                        {trans.selectedCount(selectedFoldersCountLocalized, selectedFoldersCount)}
                    </strong>
                </div>
            )}
        </>
    );
};

export default StepPrepareContent;
