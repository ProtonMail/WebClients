# Rust

To get Rust code completion and analysis from monorepo root, and so that `tauri dev` and rust-analyzer don't thrash each other's target folders, make sure you've got the following in your workspace config:

```
{
    "rust-analyzer.linkedProjects": [
        "applications/authenticator/src-tauri/Cargo.toml"
    ],
    "rust-analyzer.cargo.targetDir": true
}
```
