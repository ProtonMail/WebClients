import type { DBSchema, IDBPTransaction, StoreNames } from 'idb';

export interface Database extends DBSchema {
    config: {
        key: string;
        value: any;
    };
    index_blobs: {
        key: string;
        value: Uint8Array<ArrayBuffer>;
    };
    outdated_import_ids:
        | {
              //message id
              key: string;
              value: {
                  // message has been update or deleted?
                  deleted: boolean;
              };
          }
        // we also store the refresh flag in this store
        // which is global, not tied to a message id
        // so the value is a bit different
        | {
              key: 'refresh';
              value: '';
          };
}

/** The scope of a `Database` transaction: any array of its store names. */
export type DatabaseStores = ArrayLike<StoreNames<Database>>;

/**
 * A transaction whose scope is guaranteed to include (at least) every store in
 * `Required`, while still allowing extra stores, and whose mode is `Mode`. Prefer the
 * {@link ReadWriteTransaction} / {@link ReadTransaction} aliases over using this directly.
 */
type TransactionWithStores<
    Stores extends DatabaseStores,
    Required extends StoreNames<Database>,
    Mode extends IDBTransactionMode,
> = IDBPTransaction<Database, Stores, Mode> & ([Required] extends [Stores[number]] ? unknown : never);

/**
 * A `"readwrite"` transaction whose scope is guaranteed to include (at least) every
 * store in `Required`, while still allowing extra stores. Use it when a function
 * accepts a transaction it only partially operates on: the caller cannot pass a
 * transaction that is missing a store the function needs, yet may reuse a wider one.
 *
 * `Stores` must stay an inferred type parameter of the accepting function so the
 * caller's concrete transaction scope flows in (idb is covariant in the scope, so
 * it cannot be pinned to a fixed type without rejecting wider transactions):
 *
 *     fn<Stores extends DatabaseStores>(
 *         txn: ReadWriteTransaction<Stores, "config" | "index_blobs">
 *     ) { ... }
 */
export type ReadWriteTransaction<
    Stores extends DatabaseStores,
    Required extends StoreNames<Database>,
> = TransactionWithStores<Stores, Required, 'readwrite'>;

/**
 * Like {@link ReadWriteTransaction} but for read-only *usage*: it accepts a transaction
 * of either mode, since reading is valid on a `"readwrite"` transaction too. Use it for
 * parameters that only read, so a caller can hand over a wider write transaction.
 */
export type ReadTransaction<
    Stores extends DatabaseStores,
    Required extends StoreNames<Database>,
> = TransactionWithStores<Stores, Required, 'readonly' | 'readwrite'>;
