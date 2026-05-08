import { SearchIndexDebugPanel } from '../../components/Modals/SettingsModal/SearchIndex/SearchIndexDebugPanel';

interface SearchTabProps {
    enabled: boolean;
}

export const SearchTab = ({ enabled }: SearchTabProps) => {
    return (
        <div className="debug-view-tab-panel">
            <SearchIndexDebugPanel enabled={enabled} />
        </div>
    );
};
