# Platform Support

## Requirements

- **Node 20+** — the only runtime dependency on all platforms.

## Supported platforms

| Platform | Install methods | Config location | Clipboard |
|----------|----------------|-----------------|-----------|
| **macOS** | npx, npm global, binary | `~/.config/10x-cli/` | `pbcopy` |
| **Linux** | npx, npm global, binary | `~/.config/10x-cli/` (or `$XDG_CONFIG_HOME/10x-cli/`) | `xclip` or `xsel` |
| **Windows** | npx, npm global, binary (.exe) | `%APPDATA%\10x-cli\` | `clip.exe` |

## Zero-install usage

On any platform, run directly with npx — no global install needed:

```
npx @przeprogramowani/10x-cli auth
npx @przeprogramowani/10x-cli get m1l1
```

## Shell recommendations

| Platform | Recommended shell |
|----------|-------------------|
| macOS | Terminal.app / iTerm2 (zsh) |
| Linux | Any terminal (bash / zsh) |
| Windows | **Windows Terminal + PowerShell** — renders ANSI colors and Unicode symbols correctly. Legacy cmd.exe may garble output. |

## Clipboard

Skills that copy output to the clipboard work automatically on all platforms. Each skill provides both bash and PowerShell clipboard commands so your AI agent can pick the right one for your shell.

| Shell | Clipboard command |
|-------|-------------------|
| bash / zsh (macOS) | `pbcopy` |
| bash / zsh (Linux) | `xclip -selection clipboard` |
| bash / PowerShell (Windows) | `clip.exe` |
| PowerShell (native) | `Set-Clipboard` |

If no clipboard tool is available (e.g., headless Linux server), the copy fails silently — no error is shown.

To install clipboard support on Linux:

```bash
# Debian / Ubuntu
sudo apt install xclip

# Fedora
sudo dnf install xclip
```

## AI tool support

The CLI writes artifacts to the correct directory for your AI coding tool:

| Tool | Skills directory | Rules file | Config templates |
|------|-----------------|------------|------------------|
| Claude Code | `.claude/skills/` | `CLAUDE.md` | `.claude/config-templates/` |
| Cursor | `.cursor/skills/` | `.cursor/rules/10x-course.mdc` | `.cursor/config-templates/` |
| GitHub Copilot | `.github/skills/` | `.github/copilot-instructions.md` | `.github/config-templates/` |
| Codex CLI | `.agents/skills/` | `AGENTS.md` | `.agents/config-templates/` |
| Windsurf | `.windsurf/skills/` | `.windsurfrules` | `.windsurf/config-templates/` |
| Generic | `.ai/skills/` | `AGENTS.md` | `.ai/config-templates/` |

The CLI auto-detects your tool from project markers on first run. Override anytime with `--tool`:

```
10x get m1l1 --tool cursor
```

## CI testing

The CLI is tested on both Ubuntu and Windows in CI:

| Test level | Ubuntu | Windows |
|------------|--------|---------|
| Unit + integration (343 tests) | `check` job | `check-windows` job (PowerShell) |
| End-to-end (CLI ↔ API) | `e2e-cli` job | `e2e-cli-windows` job |

The Windows e2e job builds the CLI from source, links the `10x` binary, spins up a local API with wrangler, and runs the full test suite including `list`, `get`, `get --tool codex`, `doctor`, signature verification, and module gating.
