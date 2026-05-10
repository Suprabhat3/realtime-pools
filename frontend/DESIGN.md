---
name: Modern Zen
colors:
  surface: '#faf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2f3031'
  inverse-on-surface: '#f2f0f0'
  outline: '#8f706c'
  outline-variant: '#e4beba'
  surface-tint: '#b91d20'
  primary: '#a20513'
  on-primary: '#ffffff'
  primary-container: '#c62828'
  on-primary-container: '#ffe0dd'
  inverse-primary: '#ffb4ac'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#50504d'
  on-tertiary: '#ffffff'
  tertiary-container: '#686864'
  on-tertiary-container: '#e9e7e3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#93000e'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#faf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 24px
---

## Brand & Style

This design system is built on the Japanese concept of **Ma** (the space between), prioritizing negative space as a functional element rather than an empty void. The brand personality is disciplined, serene, and intentional. It bridges the gap between traditional craftsmanship and modern digital precision, targeting audiences who value clarity, premium quality, and a distraction-free experience.

The visual style is a blend of **Minimalism** and **Modern Editorial**. It avoids decorative clutter, relying instead on high-contrast typography, structural grid alignment, and a "less is more" philosophy. The emotional response should be one of calm focus and quiet authority.

## Colors

The palette is rooted in a traditional Japanese color story:
- **Primary:** Deep Crimson (#C62828), used sparingly for high-impact actions, hanko-style accents, and critical status indicators.
- **Surface:** Off-white/Cream (#F9F7F2) serves as the "paper" foundation, reducing eye strain and providing a warmer, more organic feel than pure white.
- **Typography:** Charcoal Black (#1A1A1A) provides high legibility and a grounded, structural feel without the harshness of absolute black.
- **Dividers:** A very pale grey or a desaturated version of the background color for subtle structural definition.

## Typography

The design system utilizes **Sora** exclusively to maintain a geometric and technical edge that contrasts with the organic background. 

- **Hierarchy:** Display sizes use tight letter spacing and bold weights to mimic the impact of traditional ink-wash calligraphy. 
- **Readability:** Body text uses a generous 1.6x line height to ensure "Ma" is present even within dense text blocks.
- **Verticality:** When appropriate for art-directed layouts, labels may be rotated 90 degrees to emulate vertical Japanese typesetting (Tatechuuyoko).

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model on desktop, centered to create a framed, gallery-like feel. 

- **The 8px Grid:** All spacing between elements must be a multiple of 8px. 
- **Margins:** Generous outer margins (80px+) are mandatory to preserve the sense of luxury and space.
- **Rhythm:** Use large vertical gaps (64px, 80px, or 120px) between major sections to allow the content to "breathe."
- **Breakpoints:** 
  - Mobile: 4 columns, 24px margins.
  - Tablet: 8 columns, 40px margins.
  - Desktop: 12 columns, 80px margins, 1280px max-width.

## Elevation & Depth

This system avoids heavy shadows to maintain a flat, paper-like aesthetic. Depth is achieved through:

- **Thin Outlines:** 1px solid borders in Charcoal (#1A1A1A) or a slightly darker cream are used for cards and containers.
- **Layering:** Elements may slightly overlap to create a sense of physical arrangement (e.g., a "rising sun" circle behind a card).
- **Z-Index:** Content that requires focus (like modals) should use a subtle, highly diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) to separate from the background without breaking the minimalist plane.

## Shapes

The primary shape language is **Sharp (0px)**. This reflects the precision of Japanese architecture and joinery. 

- **Primary Elements:** All buttons, input fields, and containers must have 90-degree corners.
- **Accents:** Perfect circles may be used exclusively for "Rising Sun" motifs, hanko-style icon backgrounds, or profile avatars to provide a soft contrast to the rigid structural grid.

## Components

- **Buttons:** Rectangular with 0px radius. Primary buttons are solid Crimson (#C62828) with white text. Secondary buttons are outlined in Charcoal with no fill.
- **Hanko Accents:** Use a small Crimson square or circle with a white icon as a "seal of quality" for featured items or verified signatures.
- **Dividers:** Use 0.5px or 1px lines. Horizontal dividers should often stop before the edge of the container to emphasize the "Ma."
- **Input Fields:** Minimalist underlines or 1px outlined boxes with sharp corners. The label should use the `label-sm` style, positioned above the field.
- **Cards:** Use a 1px border. Avoid background fills that differ from the main page background; instead, use the border to define the space.
- **Lists:** Bullet points are replaced with small Crimson squares (2px or 4px) to maintain the geometric theme.