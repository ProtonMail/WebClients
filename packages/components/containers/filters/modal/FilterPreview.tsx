import { useState } from 'react';

import { c } from 'ttag';

import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';

import { SimpleFilterModalModel } from '../interfaces';
import FilterPreviewActions from './FilterPreviewActions';
import FilterPreviewConditions from './FilterPreviewConditions';

interface Props {
    labels: Label[];
    folders: Folder[];
    model: SimpleFilterModalModel;
}

const FilterPreview = ({ labels, folders, model }: Props) => {
    const [conditionsOpen, setConditionsOpen] = useState(true);
    const [actionsOpen, setActionsOpen] = useState(true);

    return (
        <>
            <div className="border-bottom">
                <div className="flex flex-nowrap flex-column md:flex-row align-items-center pb-4 gap-4">
                    <div className="w-full md:w-1/4 pt-2 mb-2 md:mb-0">
                        <span className="mr-2">{c('Label').t`Filter Name`}</span>
                    </div>
                    <div title={model.name} className="pt-2 flex flex-column w-full">
                        <span className="max-w-full text-ellipsis">{model.name}</span>
                    </div>
                </div>
            </div>
            <FilterPreviewConditions
                model={model}
                isOpen={conditionsOpen}
                toggleOpen={() => setConditionsOpen(!conditionsOpen)}
            />
            <FilterPreviewActions
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
