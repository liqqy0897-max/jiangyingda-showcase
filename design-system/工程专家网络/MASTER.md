# 匠应达 — Design System

**Design dials:** bold editorial variance · one authored motion · compact editorial density

## Visual direction

People-first editorial campaign, not a standard enterprise landing-page template. Full-bleed candid photography, oversized Chinese serif headlines and interlocking color fields create the identity. Copy and module logic stay plain and credible while composition carries the energy.

## Core color

| Role | Value | Token |
|---|---:|---|
| Warm paper | `#FFF9EF` | `--paper` |
| Deep ink | `#0F3331` | `--ink` |
| Muted copy | `#4D6763` | `--muted` |
| Engineering teal | `#087C80` | `--teal` |
| Deep teal | `#073F3F` | `--teal-deep` |
| Campaign cyan | `#20C4CF` | `--cyan` |
| Cyan soft | `#DFF7F5` | `--cyan-soft` |
| Mist | `#F2FBF8` | `--mist` |
| Cyan pale | `#C9EFEC` | `--cyan-pale` |
| Cyan mid | `#8EDFE0` | `--cyan-mid` |
| Teal copy | `#244F4B` | `--teal-copy` |
| Action orange | `#C34B18` | `--orange` |
| Vivid orange field | `#F07032` | `--orange-bright` |
| Orange soft | `#FFE5D4` | `--orange-soft` |
| Editorial rule | `#BDD5D1` | `--line` |

On the homepage, extend the hero through warm paper, mist, cyan pale and cyan mid; these are one related canvas, not four competing accents. Keep `#C34B18` for white-text actions and rare cues. Campaign cyan carries the header, while deep teal carries navigation states and the footer. Vivid orange remains available to specific subpage narratives, not homepage module backgrounds.

## Typography

- Display: Noto Serif SC, 600–700, tracking no tighter than `-0.035em`.
- Interface/body: Noto Sans SC, 400–700.
- Hero display caps at 6rem; the aria-hidden outlined “经验” word is an environmental graphic, not semantic display copy.
- Body: 17px desktop, 16px compact screens, line-height 1.72.

## Composition

- Global content width: 1220px.
- Homepage first viewport uses a warm-paper-to-cyan gradient canvas. A compact claim and application action sit on the left; four horizontally staggered capsule windows reveal one shared image coordinate plane so people and objects continue cleanly between rows. Two copy blocks and a fine rule close the bottom. The capsule shape and light gradient are hero-only exceptions, not a general card language.
- Match the reference's horizontal proportion without over-compressing it: the homepage hero is about 620px high at 1440px and scales to 720px on wide screens instead of filling the viewport. Use an 8px spacing rhythm, with 64–104px desktop section padding and 40–72px mobile section padding.
- Subpage heroes use a full-width photograph with one title field entering from the lower edge and supporting copy directly over the scene.
- Use adjacent color fields, alternating chapters and ruled editorial columns instead of card grids. On the homepage, services fade from warm paper into mist, assurance moves from cyan pale to cyan mid, the purpose interlude returns to paper and mist, and the join section closes with cyan mid beside a warm-white form.
- Images have square editorial edges; controls use only 3–4px functional radii, except the circular mobile menu button.
- Each homepage window is built from a cyan outer capsule and a separately rounded photograph capsule over it, followed by one restrained deep-teal shadow (`0 12px 26px rgba(7,63,63,.13)`). The photograph must keep a visible curved leading edge; never fake the cyan layer with a tint over the photo. Do not extend this treatment to content modules.
- Compactness never reduces the 54px primary action or 55px form inputs; density comes from section spacing, headings and decorative image scale.

## Navigation

Global navigation contains exactly: 首页 服务方式 项目保障 关于我们. The cyan navigation field uses a deep-teal block for active and hover states. 申请加入 remains a story action and does not appear in global navigation.

Use the supplied transparent 匠应达｜工程专家经验服务平台 lockup. The header keeps the original palette. The dark footer uses an exact-geometry contrast derivative: map only deep teal to the approved on-dark light teal, preserve cyan and orange, keep transparency, and add no backing plate. Do not redraw or typeset a substitute wordmark.

## Photography

- Every page uses a purpose-specific scene: network, collaboration, review or multigenerational connection.
- Generated imagery must include a meaningful semantic description and retain its generation prompt. Subpage scenes keep the visible 场景示意图 label; the homepage capsule figure intentionally has no visible corner label.
- Avoid staged handshakes, matching uniforms, charity imagery, visible logos and retirement-home cues.

## Motion

One authored arrival moment: the homepage cyan information field reveals with clip-path and a small vertical movement over 900ms using exponential ease-out. Other feedback remains functional and brief. Respect `prefers-reduced-motion`.

## Boundaries

- No fabricated metrics, experts, partners, cases or testimonials.
- No named university relationship or 校友圈试点.
- No public internal matching, price, contract, insurance or tax detail.
- No 进入平台 or 下载桌面版 until a real destination is available and verified.

## Responsive and accessibility

- Validate 1440px desktop, 390px mobile, 320px narrow mobile and 200% zoom.
- At compact widths, image-overlay heroes become stacked editorial compositions and alternating chapters become a single reading stream.
- Maintain WCAG AA contrast, 44px minimum controls, descriptive image alternatives, visible focus and no horizontal overflow.

For the complete token and component inventory, use the repository root `DESIGN.md` and `.impeccable/design.json`.
