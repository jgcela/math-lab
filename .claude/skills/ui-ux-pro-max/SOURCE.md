# Source

- Skill: UI UX Pro Max, by nextlevelbuilder
- Version: 2.15.0 (plugin package dated 2026-10-26)
- Upstream: nextlevelbuilder/ui-ux-pro-max-skill on GitHub
- License: MIT, see `LICENSE` in this folder (Copyright (c) 2024 Next Level Builder)

Copied: only the core `ui-ux-pro-max` skill of the 7 in the package. Not copied: ui-styling, design, design-system, brand, banner-design, slides.

Local change: script paths in `SKILL.md` use `$(git rev-parse --show-toplevel)/.claude/skills/ui-ux-pro-max/` instead of `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/`, because a skill inside a repository has no plugin root. No other files were changed.

The search scripts need Python 3 and no extra packages.
