import { CreateNewFolderButton } from './CreateNewFolderButton';

interface Props {
    linkId: string;
    token: string;
}

export const EditActions = ({ token, linkId }: Props) => {
    return (
        <div className="flex gap-3 mb-8">
            <CreateNewFolderButton token={token} linkId={linkId} />
        </div>
    );
};
