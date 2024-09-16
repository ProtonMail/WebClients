import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import type { SectionConfig } from '../layout';
import Sections from './Sections';

const IndexSection = ({ pages, limit = 4 }: { pages: SectionConfig[]; limit?: number }) => {
    return (
        <div className="overview-grid">
            {pages.map(({ icon, text, to, subsections = [], available }) => {
                return (
                    <section
                        key={to}
                        className={clsx([
                            'overview-grid-item border bg-norm shadow-norm p-6',
                            subsections.length > limit && 'overview-grid-item--tall',
                        ])}
                    >
                        <h2 className="h6 mb-4 flex items-center flex-nowrap">
                            <Icon name={icon} className="mr-2 shrink-0" />
                            <strong className="text-ellipsis" title={text}>
                                {text}
                            </strong>
                        </h2>
                        <Sections to={to} subsections={subsections} text={text} available={available} />
                    </section>
                );
            })}
        </div>
    );
};

export default IndexSection;
