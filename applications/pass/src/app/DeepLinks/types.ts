export type DeepLinkRoutes = {
    address_breach: { AddressID: string; Email: string };
    alias_breach: { ShareID: string; ItemID: string; Email: string };
    alias_management: {};
    custom_email_breach: { CustomEmailID: string; Email: string };
    share_members: { ShareID: string };
    upgrade: {};
    view_item: { ShareID: string; ItemID: string };
};
