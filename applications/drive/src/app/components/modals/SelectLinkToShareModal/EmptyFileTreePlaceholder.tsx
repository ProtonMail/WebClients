import { c } from 'ttag';

import noContentSvg from '@proton/styles/assets/img/illustrations/empty-folder.svg';

const EmptyFileTreePlaceholder = () => {
    const title = c('Title').t`You have no files to share`;

    return (
        <div className="p1 flex flex-column flex-align-items-center w100">
            <img src={noContentSvg} alt={title} className="p1 mb-4 w50" />
            <h2 className="text-bold">{title}</h2>
            <p className="m-0 pb3">{c('Info').t`Go to "My files" and upload some files first.`}</p>
        </div>
    );
};

export default EmptyFileTreePlaceholder;
