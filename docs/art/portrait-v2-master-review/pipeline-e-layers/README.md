# Pipeline E · 首套正式透明部件

该阶段把已经确认的 Pipeline D 母版拆为严格同坐标的透明图层。首套注册组合是：

- 脸型：`sharp`（尖脸）
- 眼型：`round`（圆瞳）
- 发型：`long`（长直发，中分造型已经并入完整发型层）

## 目录

- `chroma/`：图像生成技能输出的纯色抠图实验稿，只用于追溯；由于生成器改变了部件尺度，不进入游戏。
- `alpha-master/`：从已确认 Pipeline D 全图确定性提取的 `1085×1450` 透明母版。
- `04-layered-alpha-composite.png`：三层在棋盘格上的合成验收图。
- 运行时文件位于 `assets/portrait-v2-formal/`，由构建脚本统一缩放为 `384×512`。

## 强制规则

- 任何图层都必须四角完全透明，且不得自行裁切画布。
- 眼睛层只包含眉毛及眼睛自身细节，不包含皮肤阴影。
- 发型层不得包含皮肤形状残留或跨模块投影。
- 只对三项部件都存在于正式清单中的组合启用位图合成；其余组合继续使用程序化安全回退。
- 不允许把旧的独立生成素材与本套正式部件混搭。
- 不允许使用生成式抠图层直接进入运行时；生成器可能改变眼睛和脸型比例，正式层必须从确认母版按固定区域和颜色所有权提取。

重新生成运行时层：

```powershell
python scripts/build-portrait-v2-formal-layers.py
```

## Ear ownership update

- Ears are extracted from the approved face master into `ears/sharp.png`.
- The face layer no longer owns ear pixels.
- Runtime order is face, eyes, hair, then ears, so the helix remains readable when hair passes behind it.
- `chroma/hair-long-filled-v2.png` is the production source: hair stays continuous behind both ears and contains no ear-shaped transparency holes.
