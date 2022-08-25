import { useState } from 'react';

import { c } from 'ttag';

import {
    Button,
    Dropdown,
    DropdownCaret,
    DropdownMenu,
    DropdownMenuButton,
    IconName,
    generateUID,
    usePopperAnchor,
} from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortParams } from '../FileBrowser/interface';

export interface MenuItem<T> {
    name: string;
    icon: IconName;
    sortField: T;
}

export default function SortDropdown<T extends string>({
    sortFields,
    sortField,
    onSort,
}: {
    sortFields?: T[];
    sortField: SortParams<T>['sortField'];
    onSort?: (sortParams: SortParams<T>) => void;
}) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const dropdownMenuButtons = sortFields?.map((sortFieldToCheck) => (
        <DropdownMenuButton
            key={sortFieldToCheck}
            className="flex flex-nowrap text-left"
            onClick={() => onSort?.({ sortField: sortFieldToCheck, sortOrder: SORT_DIRECTION.ASC })}
            aria-current={sortField === sortFieldToCheck}
        >
            {translateSortField(sortFieldToCheck)}
        </DropdownMenuButton>
    ));

    return (
        <>
            <Button
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                data-testid="toolbar-sort"
                title={c('Title').t`Sort files/folders`}
                shape="ghost"
                size="small"
                icon
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon myauto" size={16} />
            </Button>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-left"
                className="dropdown--no-max-size"
            >
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
}

export function translateSortField(sortField: string): string {
    const translations: Record<string, string> = {
        name: c('Label').t`Name`,
        size: c('Label').t`Size`,
        // Type is not used (in UI) at this moment, but users might have set
        // it, so we keep the code, so it continue to work until user changes
        // the sorting. Also, we might get it back at some point.
        mimeType: c('Label').t`Type`,
        fileModifyTime: c('Label').t`Modified`,
        metaDataModifyTime: c('Label').t`Modified`,
        linkCreateTime: c('Label').t`Created`,
        linkExpireTime: c('Label').t`Expires`,
        numAccesses: c('Label').t`# of accesses`,
        trashed: c('Label').t`Deleted`,
    };
    return translations[sortField];
}
