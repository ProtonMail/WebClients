import { c } from 'ttag';

import noContentSvg from '@proton/styles/assets/img/illustrations/empty-folder.svg';

const EmptyFileTreePlaceholder = () => {
    const title = c('Title').t`You have no files to share`;

    return (
        <div className="p-4 flex flex-column items-center w-full">
            <img src={noContentSvg} alt="" className="p-4 mb-4 w-1/3" />
            <h2 className="text-bold">{title}</h2>
            <p className="m-0 pb-11">{c('Info').t`Go to "My files" and upload some files first.`}</p>
        </div>
    );
};

export default EmptyFileTreePlaceholder;
