# All targets to lint against. Each one is installed automatically if missing.
# Defaults to ARM targets. CI overrides these with x86_64 targets matching the
# runner architecture.
TARGETS ?= aarch64-apple-darwin aarch64-pc-windows-msvc aarch64-unknown-linux-gnu

.PHONY: fmt lint

fmt:
	cargo fmt --all

lint:
	@for target in $(TARGETS); do \
		rustup target list --installed | grep -qx $$target || rustup target add $$target; \
		printf '\n[clippy] %s\n' $$target; \
		cargo clippy --workspace --all-targets --target $$target -- -D warnings; \
	done
