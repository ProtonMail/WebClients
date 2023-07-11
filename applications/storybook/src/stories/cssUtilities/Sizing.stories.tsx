import { Tooltip } from '@proton/components/components';



import { getTitle } from '../../helpers/title';
import mdx from './Sizing.mdx';


export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const demoItemClasses =
    'user-select flex flex-align-items-center py-2 flex-justify-center bg-strong rounded-sm text-center text-nowrap';
const demoContainerClasses = 'border p-4 my-4 rounded w100 relative flex flex-column gap-2 overflow-auto text-sm';

export const Fractions = () => {
    const sizes = [
        '1/2',
        '1/2',
        '1/3',
        '2/3',
        '1/4',
        '2/4',
        '1/4',
        '1/4',
        '3/4',
        '2/5',
        '1/5',
        '2/5',
        '2/5',
        '3/5',
        '1/6',
        '2/6',
        '3/6',
        '4/6',
        '2/6',
        '5/6',
        '1/6',
    ];

    return (
        <div className="border py-4 my-4 px-2 rounded w100 relative gap-y-4 flex overflow-auto">
            {sizes.map((size) => (
                <Tooltip title={`Equivalent to ${Math.round(eval(size) * 10000) / 100}%`} openDelay={0}>
                    <div className={`w-${size} px-2`}>
                        <div className={demoItemClasses}>w-{size}</div>
                    </div>
                </Tooltip>
            ))}
        </div>
    );
};

export const Responsive = () => {
    return (
        <div className="border py-4 px-2 rounded w100 relative gap-y-4 flex overflow-auto">
            <div className="w-full sm:w-1/2 md:w-2/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-2/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
        </div>
    );
};

Responsive.parameters = {
    docs: {
        iframeHeight: '250px',
        inlineStories: false,
    },
    layout: 'fullscreen',
};

export const Framework = () => {
    const sizes = [0, 'px', 2, 4, 'full', 'auto'];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} w-${size}`}>
                    <span className={`${size === 'full' || size === 'auto' ? '' : 'color-norm relative ml-8'}`}>
                        w-{size}
                    </span>
                </div>
            ))}
        </div>
    );
};