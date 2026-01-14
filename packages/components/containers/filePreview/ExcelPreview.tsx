import { c } from 'ttag';

import { ButtonWithTextAndIcon } from '@proton/components/components/button/ButtonWithTextAndIcon';
import MimeIcon from '@proton/components/components/icon/MimeIcon';
import { SHEETS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export function ExcelPreview({ onOpenInDocs, onDownload }: { onOpenInDocs?: () => void; onDownload?: () => void }) {
    const hasActions = onOpenInDocs || onDownload;

    return (
        <div
            className="m-auto flex flex-column items-center justify-space-between gap-8 w-custom"
            style={{ '--w-custom': '24rem' }}
        >
            <MimeIcon name="xls" size={15} />
            <span className="h3 text-center">
                {onOpenInDocs
                    ? c('Title').t`To preview this spreadsheet, open it in ${SHEETS_APP_NAME} or download it.`
                    : c('Title').t`To preview this spreadsheet, download it.`}
            </span>
            {hasActions && (
                <div
                    className={clsx(
                        'flex gap-2 w-full',
                        onOpenInDocs && onDownload ? 'justify-space-between' : 'justify-center'
                    )}
                >
                    {onOpenInDocs && (
                        <ButtonWithTextAndIcon
                            shape="solid"
                            color="weak"
                            mimeIconName="proton-sheet"
                            buttonText={c('Action').t`Open in ${SHEETS_APP_NAME}`}
                            onClick={onOpenInDocs}
                        />
                    )}
                    {onDownload && (
                        <ButtonWithTextAndIcon
                            iconName="arrow-down-line"
                            buttonText={c('Action').t`Download`}
                            onClick={onDownload}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
