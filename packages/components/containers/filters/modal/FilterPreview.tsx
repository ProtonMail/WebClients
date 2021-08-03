import { useState } from 'react';
import { c } from 'ttag';

import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { classnames } from '../../../helpers';

import FilterPreviewActions from './FilterPreviewActions';
import FilterPreviewConditions from './FilterPreviewConditions';

import { SimpleFilterModalModel } from '../interfaces';

interface Props {
    labels: Label[];
    folders: Folder[];
    isNarrow: boolean;
    model: SimpleFilterModalModel;
}

const FilterPreview = ({ isNarrow, labels, folders, model }: Props) => {
    const [conditionsOpen, setConditionsOpen] = useState(true);
    const [actionsOpen, setActionsOpen] = useState(true);

    return (
        <>
            <div className="border-bottom">
                <div className="flex flex-nowrap on-mobile-flex-column align-items-center pb1">
                    <div className={classnames(['w20 pt0-5', isNarrow && 'mb1'])}>
                        <span className={classnames(['mr0-5', !isNarrow && 'ml0-5'])}>{c('Label').t`Filter Name`}</span>
                    </div>
                    <div
                        title={model.name}
                        className={classnames(['pt0-5 flex flex-column flex-item-fluid max-w100', !isNarrow && 'ml1'])}
                    >
                        <span className="max-w100 text-ellipsis">{model.name}</span>
                    </div>
                </div>
            </div>
            <FilterPreviewConditions
                isNarrow={isNarrow}
                model={model}
                isOpen={conditionsOpen}
                toggleOpen={() => setConditionsOpen(!conditionsOpen)}
            />
            <FilterPreviewActions
                isNarrow={isNarrow}
                labels={labels}
                folders={folders}
                model={model}
                isOpen={actionsOpen}
                toggleOpen={() => setActionsOpen(!actionsOpen)}
            />
        </>
    );
};

export default FilterPreview;
