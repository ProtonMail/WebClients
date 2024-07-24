import { useMemo } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Icon } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { ButtonLike } from '../atoms';
import { articles } from '../constants/discover';

import '../styles/discover.scss';

export const DiscoverContainer = () => {
    const discoverArticles = useMemo(() => articles(), []);

    return (
        <div className="wallet-main relative flex flex-row flex-nowrap w-full min-h-full flex-nowrap">
            <div className="flex flex-column flex-1 flex-nowrap grow p-8 pt-8">
                <div className="flex flex-column grow">
                    <div className="flex flex-row justify-space-between m-4 items-center">
                        <div className="flex flex-row flex-nowrap items-center">
                            <h1 className="mr-4 text-semibold">{c('Discover').t`Discover`}</h1>
                        </div>
                        <div className="ui-standard">
                            <ButtonLike
                                as={Href}
                                href={getKnowledgeBaseUrl('/wallet')}
                                size="small"
                                shape="solid"
                                color="norm"
                                className="my-2"
                            >
                                {c('Action').t`Visit knowledge base`}
                                <Icon
                                    alt={c('Action').t`Visit knowledge base`}
                                    name="arrow-out-square"
                                    className="ml-2"
                                />
                            </ButtonLike>
                        </div>
                    </div>

                    <div className="grow px-8 mt-8" style={{ height: 0 }}>
                        <div className="h-full overflow-y-auto">
                            <div className="discover-articles-container">
                                {discoverArticles.map((article) => (
                                    <Href
                                        key={article.id}
                                        href={article.link}
                                        target="_blank"
                                        className="discover-articles-link unstyled flex flex-column items-center color-norm"
                                    >
                                        <img
                                            className="w-full"
                                            src={article.coverSrc}
                                            alt=""
                                            style={{ borderRadius: '24px' }}
                                        />
                                        <h2 className="w-full text-2xl text-bold mt-3 text-ellipsis-two-lines">
                                            {article.title}
                                        </h2>
                                        <p className="w-full text-lg overflow-y-hidden color-weak text-ellipsis-four-lines">
                                            {article.text}
                                        </p>
                                    </Href>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
