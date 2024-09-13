import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { type IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';

import { ButtonGroup } from '../button';

interface Props {
    title: string;
    link?: string;
    icon: IconName;
    items?: ReactNode[];
}

const DownloadClientCard = ({ title, link, items, icon }: Props) => {
    const downloadButton = (
        <ButtonLike as={Href} href={link} disabled={!link}>
            {c('Action').t`Download`}
            <span className="sr-only">{title}</span>
        </ButtonLike>
    );
    return (
        <div
            className="border rounded-lg flex flex-column items-center justify-center min-w-custom p-8"
            style={{ '--min-w-custom': '13.5rem' }}
        >
            <Icon className="mb-2" size={15} name={icon} />
            <div className="mb-6">{title}</div>

            {!items ? (
                downloadButton
            ) : (
                <ButtonGroup>
                    {downloadButton}
                    <SimpleDropdown
                        icon
                        as={Button}
                        originalPlacement="bottom-end"
                        title={c('Title').t`Open actions dropdown`}
                    >
                        <DropdownMenu>{items}</DropdownMenu>
                    </SimpleDropdown>
                </ButtonGroup>
            )}
        </div>
    );
};

export default DownloadClientCard;
