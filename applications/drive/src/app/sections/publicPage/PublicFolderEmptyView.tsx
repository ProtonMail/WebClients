import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';
import clsx from '@proton/utils/clsx';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';

export const PublicFolderEmptyView = () => {
    return (
        <div className={clsx('border-2 border-dashed rounded border-norm mb-5 h-full')}>
            <DriveEmptyView
                image={emptySvg}
                title={c('Info').t`This folder is empty`}
                // subtitle={!viewOnly && c('Info').t`Drop files here to upload or click on the upload button`}
                subtitle={c('Info').t`Drop files here to upload or click on the upload button`}
                data-testid="shared-folder-empty-placeholder"
            >
                {/*{!viewOnly && (*/}
                <>
                    {/*<input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
                    <input type="file" ref={folerInput} className="hidden" onChange={handleFolderChange} />*/}
                    <div className="flex gap-3 justify-center">
                        <Button className="flex items-center" onClick={() => {}} size="medium">
                            <Icon className="mr-2" name="folder-arrow-up" size={4} />
                            {c('Action').t`Upload folder`}
                        </Button>
                        <Button className="flex items-center" onClick={() => {}} size="medium">
                            <Icon className="mr-2" name="file-arrow-in-up" size={4} />
                            {c('Action').t`Upload files`}
                        </Button>
                    </div>
                </>
            </DriveEmptyView>
        </div>
    );
};
