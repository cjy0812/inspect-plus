# Styling And Responsive Standard

## Core rule

Do not hard-code one-off style values when a shared token, variable, or unified control can express the same design intent.

## Practical rules

1. Prefer `src/style/var.scss` variables and shared design tokens.
2. Avoid styling a single window, panel, or floating card in isolation if sibling UI should stay visually aligned.
3. When adjusting spacing, radius, or layout position, consider future mobile adaptation.
4. Avoid permanent pixel locks unless the value is intrinsic to media content or icon geometry.

## Color checks

Whenever changing colors or emphasis styles:

- check light theme visibility
- check dark theme visibility
- make sure overlays, tooltips, and floating panels still read clearly

## Responsive checks

If a change touches layout:

- prefer variables or container-based sizing over one-off absolute values
- avoid making desktop fixes that make mobile adaptation harder later

## Reporting

If a style change was made, mention in the final summary that dark/light consistency and window-to-window consistency were considered or verified.
