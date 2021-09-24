import { c } from 'ttag';
import { Icon, ToolbarButton, FileNameDisplay } from '@proton/components';
import { useEffect, useState } from 'react';

import useNavigate from '../../../../hooks/drive/useNavigate';
import useWorkingDirectory from '../../../../hooks/drive/useWorkingDirectory';
import { LinkType } from '../../../../interfaces/link';
import useDrive from '../../../../hooks/drive/useDrive';

interface Props {
    shareId: string;
    parentLinkId?: string;
    disabled?: boolean;
}

const BackButton = ({ shareId, parentLinkId, disabled }: Props) => {
    const { navigateToLink } = useNavigate();
    const { getLinkMeta } = useDrive();
    const path = useWorkingDirectory();

    const [parentLinkName, setParentLinkName] = useState<string | null>(null);
    const handleBackClick = () => {
        if (parentLinkId) {
            navigateToLink(shareId, parentLinkId, LinkType.FOLDER);
        }
    };

    useEffect(() => {
        setParentLinkName(null);

        if (!parentLinkId) {
            return;
        }

        getLinkMeta(shareId, parentLinkId)
            .then((meta) => {
                setParentLinkName(path.getLinkName(meta));
            })
            .catch(console.error);
    }, [shareId, parentLinkId]);

    const getTitleText = () => {
        if (!parentLinkName) {
            return c('Label').t`Up to the parent folder`;
        }

        return c('Label').t`Up to ${parentLinkName}`;
    };

    const title = parentLinkId && <FileNameDisplay className="w100" text={getTitleText()} />;

    return (
        <ToolbarButton
            disabled={disabled}
            title={title}
            onClick={handleBackClick}
            data-testid="toolbar-back"
            icon={<Icon name="arrow-side-up" className="on-rtl-mirror" />}
        />
    );
};

export default BackButton;
