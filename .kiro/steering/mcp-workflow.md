---
inclusion: always
---

# MCP-first workflow (NSE Mobile)

## Default MCP stack

Prefer these MCP tools over web search, guessing, or improvising UI:

| Need | MCP server | Tools |
|------|------------|-------|
| Web research, docs, branding, scraping | `user-firecrawl-mcp` | `firecrawl_scrape`, `firecrawl_search`, `firecrawl_map`, `firecrawl_extract`, `firecrawl_agent` |
| UI components, polish, logos | `user-21st-dev-magic` | `21st_magic_component_builder`, `21st_magic_component_refiner`, `21st_magic_component_inspiration`, `logo_search` |
| Issues, tasks, project tracking | `linear` | `list_issues`, `get_issue`, `save_issue`, `list_projects`, etc. |

Always read each tool's schema in `mcps/` before calling.

## When to use what

- **Firecrawl**: reference apps, NSE branding, conference info, competitor UX, API/docs. Use `branding` format for design tokens; `search`/`map` when URL is unknown.
- **21st.dev**: new or refined screens, cards, forms, nav, auth UI. Adapt output to **Flutter/Dart** (not React) while keeping layout and hierarchy.
- **Linear**: track UX bugs, auth issues, and polish work; create/update issues when the user reports problems or approves a fix list.

## Build policy

**Do not run `flutter build apk` (or any release build) unless the user explicitly asks.**

Allowed without asking: `flutter analyze`, `flutter test`, `dart format`, icon/splash regen when needed for local dev.

## Reference projects

When improving UX, use Firecrawl on reference codebases the user named (e.g. DIMA mobile, SummitMobile) before changing screens.
