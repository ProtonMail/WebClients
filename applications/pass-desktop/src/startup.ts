import { handleSquirrelEvents } from './uninstallers/windows/squirrel';

export const startup = async () => {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    await handleSquirrelEvents();
};
