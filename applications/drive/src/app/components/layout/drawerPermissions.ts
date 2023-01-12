import { Feature } from '@proton/components/containers';
import { User, UserType } from '@proton/shared/lib/interfaces';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';

export const getDriveDrawerPermissions = ({
    user,
    drawerFeature,
}: {
    user: User;
    drawerFeature: Feature<DrawerFeatureFlag> | undefined;
}) => {
    return {
        contacts: !!drawerFeature?.Value?.ContactsInDrive,
        calendar: user.Type !== UserType.EXTERNAL && !!drawerFeature?.Value?.CalendarInDrive,
    };
};
