import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';

import './DashboardBlogSection.scss';

interface Post {
    link: string;
    title: () => string;
    description: () => string;
    image: string;
}

interface Props {
    posts: Post[];
    title: string;
}

const DashboardBlogSection = ({ posts, title }: Props) => {
    const linkRef = '?ref=web-setting-dashboard-a';

    return (
        <DashboardGrid>
            <DashboardGridSection>
                <DashboardGridSectionHeader title={title} />
            </DashboardGridSection>
            <DashboardGridSection>
                <div className="grid grid-cols-none lg:grid-cols-2 gap-6 lg:gap-x-8">
                    {posts.map((post) => (
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={post.link + linkRef}
                            key={post.link}
                            className="flex flex-column lg:flex-row flex-nowrap items-start gap-4 lg:gap-6 relative hover:color-norm color-norm rounded-lg text-no-decoration group interactive-pseudo-protrude interactive--no-background"
                            aria-label={post.title()}
                            style={{ '--interactive-inset': '-0.25rem' }}
                        >
                            <figure className="w-full lg:w-2/5 rounded overflow-hidden ratio-2/1">
                                <img src={post.image} alt="" className="w-full" />
                            </figure>
                            <div className="w-full">
                                <h3 className="text-lg text-semibold mt-0 mb-2 group-hover:text-underline group-hover:color-link">
                                    {post.title()}
                                </h3>
                                <p className="m-0 text-ellipsis-two-lines color-weak">{post.description()}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default DashboardBlogSection;
