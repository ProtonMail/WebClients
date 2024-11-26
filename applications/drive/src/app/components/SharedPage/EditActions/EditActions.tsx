import { CreateNewFolderButton } from './CreateNewFolderButton';
import { UploadFileButton } from './UploadFileButton';

interface Props {
    linkId: string;
    token: string;
}

export const EditActions = ({ token, linkId }: Props) => {
    return (
        <div className="flex gap-3 mb-8">
            <UploadFileButton token={token} linkId={linkId} />
            <CreateNewFolderButton token={token} linkId={linkId} />
        </div>
    );
};
