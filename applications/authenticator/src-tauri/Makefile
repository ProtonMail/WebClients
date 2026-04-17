# Defaults to native only since cross-compilation requires target-specific
# C toolchains (e.g. MinGW for Windows). CI overrides TARGETS with x86_64.
TARGETS ?=

.PHONY: fmt lint

fmt:
	cargo fmt --all

lint:
	@if [ -z "$(TARGETS)" ]; then \
		printf '\n[clippy] native\n'; \
		cargo clippy --all-targets -- -D warnings; \
	else \
		for target in $(TARGETS); do \
			rustup target list --installed | grep -qx $$target || rustup target add $$target; \
			printf '\n[clippy] %s\n' $$target; \
			cargo clippy --all-targets --target $$target -- -D warnings; \
		done; \
	fi
