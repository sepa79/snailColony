# Repository Guidelines

- Use `pnpm` for all package operations.
- When modifying server code, run `pnpm --filter @snail/server lint` and `pnpm --filter @snail/server test`.
- When modifying client code, run `pnpm --filter @snail/client lint` and `pnpm --filter @snail/client test`.
- Update the `VERSION` file and root `package.json` when bumping versions, and document changes in `CHANGELOG.md`.
- Keep git history linear; avoid force pushes or amend after review.
