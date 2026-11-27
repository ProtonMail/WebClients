// As the Docs app: Tailwind's preflight and the page's height, Proton's page font, then the module's utilities, which
// the host loads.
import './tailwind.css';
import './fonts.css';
import 'proton-docs/homepage/tailwind.scss';
import {
    HomepageContent,
    HomepageDependenciesProvider,
    HomepageHeader,
    type HomepageNavigation,
    type HomepageRoute,
    HomepageLayout,
    HomepageSidebar,
    formatHomepageParams,
    HomepageStyleScope,
    parseHomepageParams,
    SidebarStateProvider,
} from 'proton-docs/homepage';

import { useDummyModal } from './mocks/DummyModal';
import { useDummyNotifications } from './mocks/DummyNotifications';
import { type MockDependencies, mockDependencies } from './mocks/dependencies';

/** The homepage's paths, as in the Docs app. */
export const homepagePaths = ['/recents', '/trash'];

/** The address of `route`, such as `/recents?q=plan`. */
export function getHref({ view, params }: HomepageRoute) {
    const search = formatHomepageParams(params);
    return `/${view}${search && `?${search}`}`;
}

/** The route at `pathname` and `search`, recents unless the path is the trash's. */
export function getRoute(pathname: string, search: string): HomepageRoute {
    return { view: pathname === '/trash' ? 'trash' : 'recents', params: parseHomepageParams(search) };
}

const empty = () => null;

export type StandaloneHomepageProps = {
    navigation: HomepageNavigation;
    /** Replaces the empty mocks, as the browser tests' data. */
    overrides?: Partial<MockDependencies>;
};

/**
 * The homepage module with its styles and empty mocks, on `navigation`: the page passes the window's history, the
 * browser tests an in-memory one. Share and move open a dummy modal in place of Drive's, and notifications show in a
 * dummy list in place of Proton's.
 */
export function StandaloneHomepage({ navigation, overrides }: StandaloneHomepageProps) {
    const { dummyModal, showDummyModal } = useDummyModal();
    const { dummyNotifications, createDummyNotification } = useDummyNotifications();

    return (
        <>
            {dummyModal}
            {dummyNotifications}
            <HomepageStyleScope>
                <SidebarStateProvider>
                    <HomepageDependenciesProvider
                        dependencies={{
                            ...mockDependencies,
                            ...overrides,
                            navigation,
                            createNotification: createDummyNotification,
                            openShareModal: () => showDummyModal('Share'),
                            openMoveItemsModal: () => showDummyModal('Move'),
                        }}
                    >
                        <HomepageLayout
                            sidebar={
                                <HomepageSidebar
                                    appsDropdown={empty}
                                    logo={empty}
                                    userDropdown={empty}
                                    reportDescriptionContext={[]}
                                />
                            }
                            header={<HomepageHeader headerActions={empty} />}
                        >
                            <HomepageContent />
                        </HomepageLayout>
                    </HomepageDependenciesProvider>
                </SidebarStateProvider>
            </HomepageStyleScope>
        </>
    );
}
