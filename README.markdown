# Looking For Sponsors

Enjoying [https://whatthecommit.com/](https://whatthecommit.com/)? Consider becoming a sponsor of this project. Your contributions keep the site running.

https://github.com/users/ngerakines/sponsorship

# About WTC (What The Commit)

Commitment is a small Cloudflare Worker that generates random commit messages.

    https://whatthecommit.com/

Commitment also provides https://whatthecommit.com/index.txt which provides plain text output. Some interesting usage for that can be:

```
git config --global alias.yolo '!git commit -m "$(curl -s https://whatthecommit.com/index.txt)"'
```

### Categories

Use `category` to select a message collection. `legacy` is the default and
contains the original messages; `database` and `ai` provide the new themed
collections.

```
https://whatthecommit.com/?category=database
https://whatthecommit.com/index.txt?category=ai
https://whatthecommit.com/index.json?category=legacy
```

Or use one of the following VSCode Extensions:

- [WhatTheCommit](https://marketplace.visualstudio.com/items?itemName=Gaardsholt.vscode-whatthecommit) 
- [yoloCommit](https://marketplace.visualstudio.com/items?itemName=JohnStilia.yolocommit)

## Development

Requires Node.js 20.6 or newer.

```sh
npm install
npm run dev
```

The message and contributor data are compiled into TypeScript before development
and deployment. Check the Worker configuration and types with:

```sh
npm run check
```

Deploy with the Make targets below after configuring local Cloudflare credentials.

## Deployment

Deploy credentials stay in the ignored `.env` file. Create it from
`.env.example`, then set an account-scoped `CLOUDFLARE_API_TOKEN` with
permission to edit Workers Scripts and its `CLOUDFLARE_ACCOUNT_ID`.

```sh
make deploy
```

Useful deployment targets:

```sh
make build            # Regenerate message data
make check            # Type-check and validate the Worker configuration
make deploy/preview   # Build and perform a dry-run deployment
make deploy           # Build and publish the Worker
```

Use a different local credential file with `make ENV_FILE=.env.local deploy`.

# License

Copyright (c) 2010-2024 Nick Gerakines <nick@gerakines.net>

This project and its contents are open source under the MIT license.
