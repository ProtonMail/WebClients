import { getTitle } from '../../helpers/title';
import mdx from './Opacity.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const values = ['0', '30', '40', '50', '65', '70', '100'];

const demoItemClasses =
    'user-select flex flex-align-items-center flex-justify-center bg-primary rounded-sm text-center';

export const Opacity = () => {
    return (
        <div
            className="border rounded w-full relative flex flex-nowrap gap-2 scroll-if-needed flex-align-items-center flex-justify-space-around text-2xs"
            style={{ height: '9rem' }}
        >
            {values.map((value) => (
                <div
                    key={value}
                    className="bg-strong flex-item-noshrink rounded"
                    style={{ display: 'flow-root', '--border-radius-md': '10%' }}
                >
                    <div className={`${demoItemClasses} opacity-${value}`} style={{ width: '4rem', height: '3rem' }}>
                        opacity-{value}
                    </div>
                </div>
            ))}
        </div>
    );
};
