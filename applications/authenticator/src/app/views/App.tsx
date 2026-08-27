import { type FC, useState } from 'react';

import { ItemAdd } from '../components/Items/ItemAdd';
import { Navbar } from '../components/Layout/Navbar';
import { Items } from './ItemsScreen';
import { Settings } from './SettingsScreen';

export const App: FC = () => {
    const [search, setSearch] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const handleNewClick = () => setDialogOpen(true);

    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <main className="flex flex-column flex-nowrap h-full">
            <Navbar
                search={search}
                handleNewClick={handleNewClick}
                setSearch={setSearch}
                setSettingsOpen={setSettingsOpen}
            />

            <Items search={search} handleNewClick={handleNewClick} />

            {dialogOpen && <ItemAdd onClose={() => setDialogOpen(false)} />}
            {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
        </main>
    );
};
