# Walking cat loaders

Both variants use the animation selected by the user:

- Pin: https://pin.it/3zPmOPLxZ
- Resolved pin: https://ru.pinterest.com/pin/12947917675293503/
- Original GIF: https://i.pinimg.com/originals/8c/af/c2/8cafc2665a04072d903521931ac15540.gif
- External source linked by the pin: https://youtu.be/hXZ6uSx3DkY

`CatLoader` has two variants:

- `variant="fullscreen"`: white, full-screen startup view, cat width 140 pt (responsive on narrow screens). It uses the unchanged original GIF, clipping only empty margins. `cat-splash.png` is the matching cropped first frame configured for the native launch screen at the same width. The native splash is static; animation starts as soon as React and the image are ready.
- `variant="inline"` (default): 64 pt, genuinely transparent background. Used for local asynchronous operations; compact attachment rows use 44 pt in the existing icon slot, preserving layout. Dark surfaces use a light silhouette with dark eye details.

Reduced motion and inactive app states use static PNGs. Local photo preview loading uses an overlay within its existing image area. Initial data loading in `QueryState` uses the normal indicator, separately from local operations.

The unchanged source is `pinterest-cat-original.gif` (1240 × 698). Its 33 frames last 1320 ms. Transparent WebPs preserve this timing; their encoder merges identical consecutive frames into 11 frames of 120 ms each. Their animation background and exterior pixels have zero alpha, including antialiased silhouette edges. Enclosed eye details are preserved.

Regenerate derived assets on macOS with Homebrew `webp` tools installed:

```sh
swift scripts/prepare-cat-loader.swift
```

The script crops a fixed viewport (400, 300, 412, 205), removes only the connected exterior white matte, and retains the original poses. It writes transparent light/dark WebPs and static PNGs, plus the white native splash image. No generative editing is used.

`preview.html` shows both current variants.
