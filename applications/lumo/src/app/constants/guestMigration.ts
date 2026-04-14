/**
 * Constants for guest conversation migration functionality
 */

/**
 * Storage keys used for guest migration data persistence
 */
export const GUEST_MIGRATION_STORAGE_KEYS = {
    /** Key for storing encrypted guest migration data in localStorage */
    MIGRATION_DATA: 'lumo_guest_migration_data',
    /** Key for storing encryption key in sessionStorage */
    ENCRYPTION_KEY: 'lumo_guest_encryption_key',
    /** Key for storing post-migration navigation state */
    POST_MIGRATION_NAV: 'lumo_post_migration_nav',
} as const;
