# Pipeline G · Face one-to-one mapping

The current character creator exposes six face ids in stable save order:

0. `round`
1. `oval`
2. `square`
3. `sharp`
4. `chubby`
5. `cat`

Every face master uses the registered `1085×1450` canvas. Face modules own the skull outline, nose, mouth and neck. Ears are extracted separately and composited after hair. The final comparison uses the same approved round eyes and continuous long hair for all six faces.
