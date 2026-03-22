# Tooling And Low-Memory Standard

## PowerShell

- Prefer `pwsh7` whenever available.
- First choice:
  - `C:\Program Files\PowerShell\7\pwsh.exe`
- If that path does not work, search PATH and common locations before falling back.
- Use `scripts/resolve-tooling.ps1` to locate `pwsh7` instead of guessing.

## Chrome

- Preferred path:
  - `D:\Chrome\Chrome.exe`
- If that path is missing, search:
  - environment variables such as `CHROME_PATH`
  - PATH
  - common install locations under Program Files and LocalAppData

## Low-memory validation

This machine can hit memory pressure quickly, so validation should stay intentional.

- Prefer `pnpm -s type-check` as the default safety check.
- Use focused linting instead of repo-wide heavy commands when the touched scope is small.
- Use low-memory builds only when the extra signal is worth the cost.

Recommended low-memory build pattern:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=1536'
pnpm -s build
```

Do not run broad heavyweight validation repeatedly in a single round unless the user explicitly wants that confidence level.
