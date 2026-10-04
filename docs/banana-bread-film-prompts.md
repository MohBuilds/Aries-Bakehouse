# Banana Bread Film — Prompts

## How to use
1. Use **one ChatGPT chat** for all images, in order.
2. **EDIT** = upload the named image and say "edit this image" + the prompt.
3. Save each result with the filename shown. Put everything in a folder `banana-film/`.
4. If the loaf drifts, reply: *"Keep the loaf, angle, framing and light identical to BB-01. Only change: …"*

---

## Step 1 — Paste first (upload `aries11-bananabread-topping-plain.png`)
```
This photo is our real banana bread. Match it exactly in every image I ask for.

Rules for every image:
- 3/4 view from front-left, 30° above, loaf centred, loaf ~55% of frame width
- Plain dark chocolate background (#1C0D0A), darker at the edges
- Warm soft light from upper left, thin warm rim light from behind
- Real bakery look, real texture, not glossy, not CGI
- No text, logos, hands, plates or props
- Square 2048 × 2048 PNG

Reply "Locked".
```

---

## Step 2 — Images

| # | Save as | How | Prompt |
|---|---|---|---|
| 1 | `BB-01.png` | New | `One large plain banana bread loaf following the rules. Golden domed top with a natural centre crack, light brown-butter sheen.` |
| 2 | `BB-02-hero.png` | EDIT BB-01 | `Keep everything identical. Add a soft wisp of steam from the crack and a few crumbs floating in the rim light.` |
| 3 | `BB-03-sliced.png` | EDIT BB-01 | `Keep everything identical. The loaf is cut into 7 even slices, still standing together with hairline gaps.` |
| 4 | `BB-04-exploded.png` | EDIT BB-03 | `The 7 slices now float apart in the air with even gaps, each tilted toward the camera to show the moist crumb with banana flecks. A few crumbs in the air.` |
| 5 | `BB-05-macro-crumb.png` | New | `Extreme close-up of the cut face of a slice: moist golden crumb, banana flecks, shallow focus. Fills the frame.` |
| 6 | `BB-06-macro-crust.png` | New | `Extreme close-up of the top crust crack: caramelised edges, brown-butter shine. Fills the frame.` |
| 7 | `BB-07-sizes.png` | New | `Three plain loaves side by side in true scale: mini, medium, large. Wide 3072 × 1536.` |

---

## Step 3 — Toppings
Each one is an **EDIT of BB-01** (not of the previous topping). Also upload the matching real topping photo.

Prompt:
```
Keep the loaf, angle, framing, background and light exactly the same.
Only add this topping on top, matching the second photo: [TOPPING]
```

| Save as | Real photo to upload | [TOPPING] |
|---|---|---|
| `BB-10-oreo.png` | topping-oreo | two Oreo cookies pressed into the top, Oreo crumbs |
| `BB-11-doublechoc.png` | topping-doublechocolate | dark chocolate loaf covered in chocolate chips |
| `BB-12-coconut.png` | topping-coconutflakes | toasted coconut flakes piled along the top |
| `BB-13-nuts.png` | topping-nutscrunch * | chopped toasted nuts |
| `BB-14-biscoff.png` | topping-biscoff * | crushed Biscoff crumb over the whole top |
| `BB-15-raisins.png` | topping-raisins | dark raisins pressed into the crust |
| `BB-16-mixed.png` | topping-mixed | top split into 4 zones: Oreo, chocolate chips, coconut, raisins |

\* These two photos look swapped — check before uploading.

Plain = just copy `BB-01.png`.

---

## Step 4 — Videos (Sora)
Settings: **1:1 · 1080 × 1080 · 24 fps · 5 sec · camera locked · no text**

| Save as | Start image | Prompt |
|---|---|---|
| `BB-V1-spin.mp4` | BB-16-mixed | `The loaf rotates exactly 360° at a steady speed and ends where it started. Camera and light do not move.` |
| `BB-V2-explode.mp4` | BB-03 → end BB-04 | `The slices slowly glide apart into the floating arrangement of the end image. Camera locked.` |
| `BB-V3-oreo-drop.mp4` | BB-01 → end BB-10 | `Oreo cookies and crumbs fall in slow motion and land on the loaf as in the end image. Camera locked.` |

---

## Minimum to start
`BB-01, BB-02, BB-03, BB-04, BB-05, BB-10 to BB-16, BB-V1, BB-V2`
