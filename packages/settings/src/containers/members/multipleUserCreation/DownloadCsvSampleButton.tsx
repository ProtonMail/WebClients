import type { ElementType, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { CreateMemberMode } from '@proton/shared/lib/interfaces/Member';

import type { CsvConfig } from './csv';
import { downloadSampleCSV } from './csv';

interface Props<E extends ElementType> {
    csvConfig: Omit<CsvConfig, 'mode'>;
    content?: ReactNode;
    as?: E;
    className?: string;
    color?: 'norm' | 'weak' | 'danger' | 'warning' | 'success' | 'info';
}

/**
 * Offers one template per creation mode. Which one was downloaded isn't tracked, since the uploaded
 * file is what decides how the accounts are created. When only invitations are allowed, only the invite template is offered.
 */
const DownloadCsvSampleButton = <E extends ElementType>({
    csvConfig,
    content = c('Action').t`Download CSV sample`,
    as,
    ...rest
}: Props<E>) => {
    const handleDownload = (mode: CreateMemberMode) => {
        downloadSampleCSV({ ...csvConfig, mode });
    };

    if (csvConfig.invitationsOnly) {
        const Component: ElementType = as ?? Button;
        return (
            <Component {...rest} onClick={() => handleDownload(CreateMemberMode.Invitation)}>
                {content}
            </Component>
        );
    }

    return (
        <SimpleDropdown {...rest} as={as} content={content}>
            <DropdownMenu>
                {/* Each item downloads a file, so none of them is ever marked as selected — selected
                    items are inert, which would stop the same template being downloaded twice in a row. */}
                <DropdownMenuButton className="text-left" onClick={() => handleDownload(CreateMemberMode.Invitation)}>
                    {c('Action').t`Template with invite links`}
                </DropdownMenuButton>
                <DropdownMenuButton className="text-left" onClick={() => handleDownload(CreateMemberMode.Password)}>
                    {c('Action').t`Template with passwords`}
                </DropdownMenuButton>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default DownloadCsvSampleButton;
