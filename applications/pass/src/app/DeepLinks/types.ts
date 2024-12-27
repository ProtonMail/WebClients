export type DeepLinkRoutes = {
    share_members: {
        ShareId: string;
    };
    alias_breach: {
        ShareId: string;
        ItemId: string;
        Email: string;
    };
    custom_email_breach: {
        CustomEmailId: string;
        Email: string;
    };
    address_breach: {
        AddressId: string;
        Email: string;
    };
    upgrade: null;
    view_item: {
        ShareId: string;
        ItemId: string;
    };
};
