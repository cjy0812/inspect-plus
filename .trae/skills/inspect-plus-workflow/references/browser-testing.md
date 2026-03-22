# Browser Testing Standard

Run this only at the end of the round unless the user explicitly asks for mid-round browser testing.

## Chrome remote debugging

Project-standard launch command:

```powershell
D:\Chrome\Chrome.exe --remote-debugging-port=9222 --user-data-dir="D:\Chrome\UserData" --profile-directory="Default"
```

## Endpoint checks

Before using `chrome-devtools-mcp`, confirm:

- Vite app: `http://127.0.0.1:8444/`
- Chrome debugging: `http://127.0.0.1:9222/json/version`

Use `scripts/check-browser-prereqs.ps1` for a quick status check.

## Fixed route order

Smoke test in this order:

1. `/`
2. `/device`
3. `/selector`
4. `/svg`

If the round touched snapshot code, add one real snapshot page check after those.

## Per-page checks

For each page:

1. capture a page snapshot
2. inspect console messages
3. classify findings

## Classification

Treat these as real failures:

- blank page
- Vue runtime warning or error tied to current work
- missing slot props
- failed navigation
- uncaught errors that reproduce on a clean page load

Report separately, but do not treat as blocking runtime failures:

- `A form field element should have an id or name attribute`
- Vite hot-update debug messages
- unrelated userscript noise that is not caused by the current change
