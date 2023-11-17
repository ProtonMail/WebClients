import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components';

import useDesktopDownloads from '../../../hooks/drive/useDesktopDownloads';

interface Props {
    className?: string;
}

const DesktopDownloadDropdown = ({ className }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { isLoading, downloads } = useDesktopDownloads();

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
                        <CircleLoader className="w-full flex flex-align-items-center my-2" />
                    ) : (
                        downloads.map(({ platform, icon, name, url, startDownload }) => (
                            <DropdownMenuButton
                                className="text-left flex flex-align-items-center"
                                key={platform}
                                disabled={!url}
                                onClick={startDownload}
                            >
                                <Icon name={icon} className="color-weak mr-2" />
                                {name}
                            </DropdownMenuButton>
                        ))
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default DesktopDownloadDropdown;
