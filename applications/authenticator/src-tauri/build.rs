fn main() {
    #[cfg(feature = "devtools")]
    println!("cargo:warning=⚠️ tauri/devtools enabled");

    tauri_build::build()
}
