import type { FC } from 'react';

import { Counter } from '@proton/pass/components/Layout/Badge/Counter';

type Props = { index: string; description: string | any[]; img?: string; alt?: string };

export const SidebarMoreInfoFlowSection: FC<Props> = ({ index, description, img, alt }) => {
    return (
        <>
            <div className="flex items-center justify-center flex-nowrap gap-2">
                <Counter>{index}</Counter>
                <hr className="w-full mt-4" />
            </div>
            <p>{description}</p>
            <img src={img} alt={alt} className="pb-4" />
        </>
    );
};
