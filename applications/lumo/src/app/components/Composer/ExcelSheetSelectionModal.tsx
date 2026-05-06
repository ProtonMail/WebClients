import { useCallback, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Checkbox, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalProps } from '@proton/components';

import type { ExcelSheetInfo } from '../../services/files/excelSheets';

export type ExcelSheetSelectionRequest = {
    fileName: string;
    sheets: ExcelSheetInfo[];
    resolve: (sheetNames: string[] | null) => void;
};

type ExcelSheetSelectionModalProps = Omit<ModalProps, 'children' | 'onClose'> & {
    fileName: string;
    sheets: ExcelSheetInfo[];
    onCancel: () => void;
    onConfirm: (sheetNames: string[]) => void;
};

export const ExcelSheetSelectionModal = ({
    fileName,
    sheets,
    onCancel,
    onConfirm,
    ...modalProps
}: ExcelSheetSelectionModalProps) => {
    const [selectedSheetNames, setSelectedSheetNames] = useState(() => new Set(sheets.map(({ name }) => name)));
    const selectedCount = selectedSheetNames.size;
    const areAllSheetsSelected = selectedCount === sheets.length;
    const areSomeSheetsSelected = selectedCount > 0 && !areAllSheetsSelected;

    const sheetNames = useMemo(() => sheets.map(({ name }) => name), [sheets]);

    const toggleAllSheets = () => {
        setSelectedSheetNames(areAllSheetsSelected ? new Set() : new Set(sheetNames));
    };

    const toggleSheet = (sheetName: string) => {
        setSelectedSheetNames((current) => {
            const next = new Set(current);
            if (next.has(sheetName)) {
                next.delete(sheetName);
            } else {
                next.add(sheetName);
            }
            return next;
        });
    };

    return (
        <ModalTwo size="medium" {...modalProps} onClose={onCancel}>
            <ModalTwoHeader title={c('collider_2025: Header').t`Choose sheets to add`} />
            <ModalTwoContent>
                <p className="m-0 mb-3 color-weak">
                    {c('collider_2025: Info')
                        .t`"${fileName}" has multiple sheets. Select the sheets to include in the conversation context.`}
                </p>
                <div className="flex flex-nowrap items-center mb-3">
                    <Checkbox
                        id="excel-sheet-select-all"
                        checked={areAllSheetsSelected}
                        indeterminate={areSomeSheetsSelected}
                        onChange={toggleAllSheets}
                        className="mr-2"
                    />
                    <label htmlFor="excel-sheet-select-all" className="flex-1">
                        {c('collider_2025: Action').t`Select all`}
                    </label>
                </div>
                <ul className="unstyled m-0">
                    {sheets.map((sheet) => {
                        const id = `excel-sheet-${sheet.index}`;
                        return (
                            <li key={sheet.name} className="flex flex-nowrap items-center mb-2">
                                <Checkbox
                                    id={id}
                                    checked={selectedSheetNames.has(sheet.name)}
                                    onChange={() => toggleSheet(sheet.name)}
                                    className="mr-2"
                                />
                                <label htmlFor={id} className="flex-1">
                                    <span>{sheet.name}</span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onCancel} className="mr-2">
                    {c('collider_2025: Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    disabled={selectedCount === 0}
                    onClick={() => onConfirm(Array.from(selectedSheetNames))}
                >
                    {c('collider_2025: Action').ngettext(
                        msgid`Add ${selectedCount} sheet`,
                        `Add ${selectedCount} sheets`,
                        selectedCount
                    )}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

/**
 * Encapsulates the state and rendering needed to prompt the user to choose
 * which sheets of an Excel file should be imported. Consumers receive a
 * `requestSheetSelection` function that resolves to the selected sheet names
 * (or null if cancelled) and a `modal` node that should be rendered in the tree.
 */
export const useExcelSheetSelection = () => {
    const [request, setRequest] = useState<ExcelSheetSelectionRequest | null>(null);

    const requestSheetSelection = useCallback((file: File, sheets: ExcelSheetInfo[]) => {
        return new Promise<string[] | null>((resolve) => {
            setRequest({
                fileName: file.name,
                sheets,
                resolve,
            });
        });
    }, []);

    const closeRequest = useCallback(
        (sheetNames: string[] | null) => {
            request?.resolve(sheetNames);
            setRequest(null);
        },
        [request]
    );

    const modal = request ? (
        <ExcelSheetSelectionModal
            open
            fileName={request.fileName}
            sheets={request.sheets}
            onCancel={() => closeRequest(null)}
            onConfirm={closeRequest}
        />
    ) : null;

    return {
        requestSheetSelection,
        modal,
        isOpen: request !== null,
    };
};
