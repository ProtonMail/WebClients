import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';

import { ButtonGroup } from '../button';
import { Block, Bordered } from '../container';
import { DropdownMenu, SimpleDropdown } from '../dropdown';
import { Icon, IconName } from '../icon';

interface Props {
    title: string;
    link: string;
    icon: IconName;
    items?: ReactNode[];
}

const DownloadClientCard = ({ title, link, items, icon }: Props) => {
    return (
        <Bordered className="rounded-lg flex flex-column flex-align-items-center pt2 pb2 pl3 pr3 mt1 mr1">
            <div>
                <Icon size={60} name={icon} />
            </div>
            <Block>{title}</Block>
            {!items ? (
                <div className="pl1 pr1 flex mt1 flex-justify-center">
                    <ButtonLike as={Href} href={link}>
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
                </div>
            ) : (
                <ButtonGroup className="flex pl0-25 pr0-25 mt1 flex-justify-center">
                    <ButtonLike as={Href} href={link}>
                        {c('Action').t`Download`}
                        <span className="sr-only">{title}</span>
                    </ButtonLike>
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
        </Bordered>
    );
};
export default DownloadClientCard;
