import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../Button';

import './Tip.scss';

interface Props {
    className?: string;
    image: string;
    text: string;
    action: ReactNode;
}

export const Tip = ({ className, image, text, action }: Props) => {
    const [isClosed, setClosed] = useState(false);

    if (isClosed) {
        return null;
    }

    return (
        <div className={clsx('tip rounded-lg flex flex-row flex-nowrap items-center p-4', className)}>
            <div className="no-shrink">
                <img src={image} alt="" />
            </div>
            <div className="flex flex-column mx-4">
                <div className="font-semibold">{text}</div>
                <div className="tip--action font-semibold mt-1">{action}</div>
            </div>
            <div className="tip--close no-shrink">
                <CoreButton
                    icon
                    shape="ghost"
                    size="small"
                    onClick={() => {
                        setClosed(true);
                    }}
                >
                    <Icon name="cross" alt={c('Action').t`Close tip`} />
                </CoreButton>
            </div>
        </div>
    );
};
