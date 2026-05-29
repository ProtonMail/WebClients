import type { ReactElement } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { isLabelIDNewsletterSubscription } from '../../../helpers/labels';
import { FilterList } from '../list-settings/FilterList';

interface Props {
    classname: string;
    labelID: string;
    selectAll: ReactElement;
}

const ToolbarNarrow = ({ classname, selectAll, labelID }: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);

    return (
        <div className="w-full">
            <nav
                className={clsx(classname, 'justify-space-between py-1 pl-3 pr-2 border-bottom border-weak')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center toolbar-inner gap-2">{selectAll}</div>

                <div className="flex items-center toolbar-inner gap-2">
                    {isLabelIDNewsletterSubscription(labelID) ? null : <FilterList />}
                </div>
            </nav>
        </div>
    );
};

export default ToolbarNarrow;
