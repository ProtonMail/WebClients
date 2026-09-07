import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import type { IconComponent } from '@proton/icons/component';

import { ButtonGroup } from '../button/ButtonGroup';
import DropdownMenu from '../dropdown/DropdownMenu';
import SimpleDropdown from '../dropdown/SimpleDropdown';

interface Props {
    title: ReactNode;
    link?: string;
    icon: IconComponent;
    items?: ReactNode[];
    onClick?: () => void;
}

const DownloadClientCard = ({ title, link, items, icon: Icon, onClick }: Props) => {
    const downloadButton = (
        <ButtonLike as={Href} href={link} disabled={!link} onClick={onClick}>
            {c('Action').t`Download`}
            <span className="sr-only">{title}</span>
        </ButtonLike>
    );
    return (
        <div
            className="border rounded-lg flex flex-column items-center justify-center min-w-custom p-8"
            style={{ '--min-w-custom': '13.5rem' }}
        >
            <span className="mb-2 flex">
                <Icon size={15} />
            </span>
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
