import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';

import { ButtonGroup } from '../button';
import { DropdownMenu, SimpleDropdown } from '../dropdown';
import { Icon, IconName } from '../icon';

interface Props {
    title: string;
    link: string;
    icon: IconName;
    items?: ReactNode[];
}

const DownloadClientCard = ({ title, link, items, icon }: Props) => {
    const downloadButton = (
        <ButtonLike as={Href} href={link}>
            {c('Action').t`Download`}
            <span className="sr-only">{title}</span>
        </ButtonLike>
    );
    return (
        <div
            className="border rounded-lg flex flex-column items-center justify-center min-w-custom p-8"
            style={{ '--min-w-custom': '13.5rem' }}
        >
            <Icon className="mb-2" size={60} name={icon} />
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
