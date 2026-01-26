import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import DriveLogo from '@proton/components/components/logo/DriveLogo';

export interface PublicHeaderProps {
    name: string;
    sharedBy: string | undefined;
    onDownload: () => Promise<void>;
    onDetails?: () => void;
    onCopyLink?: () => Promise<void>;
}

export const PublicHeader = ({ name, sharedBy, onDownload, onDetails, onCopyLink }: PublicHeaderProps) => {
    return (
        <div className="flex justify-space-between my-4">
            <div className="flex items-start">
                <DriveLogo to="/" variant="glyph-only" />
                <div className="ml-3">
                    <h1 className="lh100">{name}</h1>
                    {sharedBy && (
                        <span className="flex gap-1 color-weak mt-1">
                            {c('Subtitle').t`Shared by ${sharedBy}`}
                            <span className="text-norm mx-1">&#x2022;</span>
                            {c('Info').t`End-to-end encrypted`}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <Button icon shape="ghost" title={c('Action').t`Copy link`} onClick={onCopyLink}>
                    <Icon name="link" size={5} alt={c('Action').t`Copy link`} />
                </Button>
                <Button icon shape="ghost" title={c('Action').t`Details`} onClick={onDetails}>
                    <Icon name="info-circle" size={5} alt={c('Action').t`Details`} />
                </Button>
                <Button shape="ghost" onClick={onDownload}>
                    <Icon className="mr-2" name="arrow-down-line" size={5} />
                    {c('Action').t`Download`}
                </Button>
                <hr className="bg-weak m-0 w-custom h-90" style={{ '--w-custom': '1px' }} />
                {/*// TODO Implement logic there*/}
                <Button shape="solid" onClick={() => alert('Not implemented yet')}>
                    {c('Action').t`Save for later`}
                </Button>
                <Button shape="solid" color="norm" onClick={() => alert('Not implemented yet')}>
                    {c('Action').t`Sign up`}
                </Button>
            </div>
        </div>
    );
};
