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

Skills that copy output to the clipboard work automatically on all platforms. If the clipboard tool is not available (e.g., no `xclip` on a headless Linux server), the copy fails silently — no error is shown.

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

The CLI test suite runs on both Ubuntu and Windows in CI, catching platform regressions before release.
