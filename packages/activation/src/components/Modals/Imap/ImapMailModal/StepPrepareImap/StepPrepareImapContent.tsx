import { c } from 'ttag';

import { getTimeUnitLabels } from '@proton/activation/src/constants';
import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import type { TIME_PERIOD } from '@proton/activation/src/interface';
import { Icon, LabelStack, Tooltip } from '@proton/components';
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
                <Icon className="mr-2" name="inbox" />
                {c('Info').t`Import mailbox`}
            </div>

            <div className="mb-4 ml-4 flex items-center">
                <Icon className="mr-2" name="clock" />
                {c('Label').t`Import interval`}
                {`: `}
                <strong className="ml-2">{timeUnitLabels[selectedPeriod]}</strong>
            </div>

            <div className="mb-4 ml-4 flex items-center flex-nowrap">
                <Icon className="shrink-0 mr-2" name="tag" />
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
                <Icon className="mr-2" name={isLabelMapping ? 'tags' : 'folders'} />
                {trans.foundCount(providerFoldersNumLocalized, providerFoldersNum)}

                {showMaxFoldersError && (
                    <Tooltip title={trans.errorMaxItems()} originalPlacement="right">
                        <Icon className="ml-2 color-danger" name="exclamation-circle-filled" size={4.5} />
                    </Tooltip>
                )}
            </div>

            {selectedFoldersCount !== providerFoldersNum && (
                <div className="mb-4 ml-8 flex items-center">
                    <strong>
                        <Icon className="mr-2" name={isLabelMapping ? 'tags' : 'folders'} />
                        {trans.selectedCount(selectedFoldersCountLocalized, selectedFoldersCount)}
                    </strong>
                </div>
            )}
        </>
    );
};

export default StepPrepareContent;
