import { c } from 'ttag';

import { ButtonWithTextAndIcon } from '@proton/components/components/button/ButtonWithTextAndIcon';
import MimeIcon from '@proton/components/components/icon/MimeIcon';
import { SHEETS_APP_NAME } from '@proton/shared/lib/constants';

export function ExcelPreview({ onOpenInDocs, onDownload }: { onOpenInDocs?: () => void; onDownload?: () => void }) {
    return (
        <div
            className="m-auto flex flex-column items-center justify-space-between gap-8 w-custom"
            style={{ '--w-custom': '24rem' }}
        >
            <MimeIcon name="xls" size={15} />
            <span className="h3 text-center">{c('Title')
                .t`To preview this spreadsheet, open it in ${SHEETS_APP_NAME} or download it.`}</span>
            <div className="flex justify-space-between gap-2 w-full">
                <ButtonWithTextAndIcon
                    shape="solid"
                    color="weak"
                    mimeIconName="proton-sheet"
                    buttonText={c('Action').t`Open in ${SHEETS_APP_NAME}`}
                    onClick={onOpenInDocs}
                />
                <ButtonWithTextAndIcon
                    iconName="arrow-down-line"
                    buttonText={c('Action').t`Download`}
                    onClick={onDownload}
                />
            </div>
        </div>
    );
}
