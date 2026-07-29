SHELL := /bin/bash
.ONESHELL:

ENV_FILE ?= .env
WRANGLER ?= npx wrangler
WRANGLER_LOG_PATH ?= .wrangler/wrangler.log

.PHONY: build check deploy deploy/preview typegen wrangler/deploy wrangler/deploy/preview

# Generate the Worker data module from the checked-in message collections.
build:
	npm run build:data

# Type-check and validate the Worker upload without publishing it.
check: build
	npm run check

# Refresh Cloudflare binding types after changing wrangler.jsonc.
typegen:
	npm run typegen

# Build and publish the Worker using credentials from the ignored environment file.
deploy: build
	$(MAKE) --no-print-directory ENV_FILE="$(ENV_FILE)" WRANGLER="$(WRANGLER)" WRANGLER_LOG_PATH="$(WRANGLER_LOG_PATH)" wrangler/deploy

wrangler/deploy:
	set -euo pipefail
	test -f "$(ENV_FILE)" || { echo "Missing $(ENV_FILE); create it from .env.example." >&2; exit 1; }
	set -a
	source "$(ENV_FILE)"
	set +a
	WRANGLER_LOG_PATH="$(WRANGLER_LOG_PATH)" $(WRANGLER) deploy

# Build and validate the Worker upload using the same local credentials.
deploy/preview: build
	$(MAKE) --no-print-directory ENV_FILE="$(ENV_FILE)" WRANGLER="$(WRANGLER)" WRANGLER_LOG_PATH="$(WRANGLER_LOG_PATH)" wrangler/deploy/preview

wrangler/deploy/preview:
	set -euo pipefail
	test -f "$(ENV_FILE)" || { echo "Missing $(ENV_FILE); create it from .env.example." >&2; exit 1; }
	set -a
	source "$(ENV_FILE)"
	set +a
	WRANGLER_LOG_PATH="$(WRANGLER_LOG_PATH)" $(WRANGLER) deploy --dry-run
