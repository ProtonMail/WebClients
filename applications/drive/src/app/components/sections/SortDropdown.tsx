import { useState } from 'react';
import { c } from 'ttag';

import {
    generateUID,
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Button,
    DropdownCaret,
} from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { AllSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';

export interface MenuItem<T extends AllSortKeys> {
    name: string;
    icon: string;
    sortField: T;
}

export default function SortDropdown<T extends AllSortKeys>({
    sortFields,
    sortParams,
    setSorting,
}: {
    sortFields: T[];
    sortParams: SortParams<T>;
    setSorting: (sortParams: SortParams<T>) => void;
}) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const dropdownMenuButtons = sortFields.map((sortField) => (
        <DropdownMenuButton
            key={sortField}
            className="flex flex-nowrap text-left"
            onClick={() => setSorting({ sortField, sortOrder: SORT_DIRECTION.ASC })}
            aria-current={sortParams.sortField === sortField}
        >
            {translateSortField(sortField)}
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
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" />
            </Button>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom"
                className="dropdown--no-max-size"
            >
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
}

export function translateSortField(sortField: AllSortKeys): string {
    const translations: Record<AllSortKeys, string> = {
        Name: c('Label').t`Name`,
        Size: c('Label').t`Size`,
        // Type is not used (in UI) at this moment, but users might have set
        // it, so we keep the code, so it continue to work until user changes
        // the sorting. Also, we might get it back at some point.
        MIMEType: c('Label').t`Type`,
        // On API its called ModifyTime, but its actually time when the last
        // revision was uploaded. The real modify time is stored in encrypted
        // extended attributes.
        ModifyTime: c('Label').t`Uploaded`,
        CreateTime: c('Label').t`Created`,
        ExpireTime: c('Label').t`Expires`,
    };
    return translations[sortField];
}
