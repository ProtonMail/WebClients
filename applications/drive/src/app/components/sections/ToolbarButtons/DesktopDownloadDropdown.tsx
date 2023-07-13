import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuLink,
    DropdownSizeUnit,
    Icon,
    IconName,
    usePopperAnchor,
} from '@proton/components';
import { DropdownMenuButton } from '@proton/components/components';
import { useLoading } from '@proton/hooks';
import { fetchDesktopVersion } from '@proton/shared/lib/apps/desktopVersions';
import { DESKTOP_APP_NAMES, DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';

interface Props {
    className?: string;
}

interface DesktopClient {
    id: string;
    icon: IconName;
    platform: DESKTOP_PLATFORMS;
    versionFile: string;
    version: 'latest' | string;
    label: string;
    file?: {
        url: string;
        version: string;
    };
}

const desktopClients: DesktopClient[] = [
    {
        id: 'windows',
        icon: 'brand-windows',
        platform: DESKTOP_PLATFORMS.WINDOWS,
        versionFile: 'windows/version.json',
        version: 'latest',
        label: c('Platform').t`Windows`,
    },
];

const DesktopDownloadDropdown = ({ className }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [clients, setClients] = useState<DesktopClient[]>();
    const [isLoading, withLoading] = useLoading(true);

    useEffect(() => {
        void withLoading(
            Promise.all(
                desktopClients.map(async (desktopClient) => {
                    const desktopVersion = await fetchDesktopVersion({
                        appName: DESKTOP_APP_NAMES.DRIVE,
                        version: desktopClient.version,
                        platform: desktopClient.platform,
                        category: RELEASE_CATEGORIES.STABLE,
                    }).catch((err) => {
                        console.error(err);
                        return undefined;
                    });
                    return {
                        ...desktopClient,
                        file: desktopVersion,
                    };
                })
            ).then(setClients)
        );
    }, [desktopClients]);

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
                shape="ghost"
                size="small"
                className={className}
            >
                {c('Action').t`Download apps`}
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{
                    width: DropdownSizeUnit.Anchor,
                }}
            >
                <DropdownMenu>
                    {isLoading ? (
                        <CircleLoader className="w100 flex flex-align-items-center my-2" />
                    ) : (
                        clients?.map((client) => {
                            if (client.file?.url) {
                                return (
                                    <DropdownMenuLink
                                        className="text-left flex flex-align-items-center"
                                        href={client.file.url}
                                        download
                                        key={client.id}
                                    >
                                        <Icon name={client.icon} className="color-weak mr-2" />
                                        {client.label}
                                    </DropdownMenuLink>
                                );
                            } else {
                                return (
                                    <DropdownMenuButton
                                        className="text-left flex flex-align-items-center"
                                        disabled
                                        key={client.id}
                                    >
                                        <Icon name={client.icon} className="color-weak mr-2" />
                                        {client.label}
                                    </DropdownMenuButton>
                                );
                            }
                        })
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default DesktopDownloadDropdown;
