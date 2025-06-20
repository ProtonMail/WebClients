import { c } from 'ttag';

import { Button } from '@proton/atoms';
import noContentSvg from '@proton/styles/assets/img/illustrations/empty-folder.svg';

interface Props {
    onCreate: () => void;
}

const EmptyFileTreePlaceholder = ({ onCreate }: Props) => {
    const title = c('Title').t`You have no folders yet`;
    return (
        <div className="p-4 flex flex-column items-center w-full">
            <img src={noContentSvg} alt={title} className="p-4 mb-4 w-1/2" />
            <h2 className="text-bold">{title}</h2>
            <p className="m-0">{c('Info').t`Create your first folder and start moving your files.`}</p>
            <div className="my-8 flex flex-column w-custom" style={{ '--w-custom': '13em' }}>
                <Button size="large" color="norm" className="mx-4 mt-1 text-strong" onClick={onCreate}>
                    {c('Action').t`Create`}
                </Button>
            </div>
        </div>
    );
};

export default EmptyFileTreePlaceholder;
