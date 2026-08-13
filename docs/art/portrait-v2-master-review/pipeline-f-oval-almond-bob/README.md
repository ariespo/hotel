# Pipeline F · Oval face, almond eyes and bob hair

Approved formal combination: `oval + almond + part + bob`.

All masters use the registered `1085×1450` canvas. Runtime layers are deterministically extracted and resized to `384×512`.

## Ownership and registration

- The face layer owns the skull, facial outline, nose, mouth and neck, but no ear pixels.
- Ears are isolated in `ears/oval.png` and composited after hair.
- `chroma/hair-bob-filled-v2.png` keeps the bob continuous behind both ears instead of cutting ear-shaped holes into the hairstyle.
- The eye layer keeps lashes, iris texture and highlights without skin shadow.
- The bob crown uses the same top clearance as the approved long hairstyle while retaining its jaw-length endpoint.
- Only the exact approved combination may activate these raster layers.
