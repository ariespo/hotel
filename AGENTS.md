# 项目更新规则

- 每次修改游戏、测试、资源、构建或部署配置，都必须新增或更新 `changes/YYYY.MM.DD-NN.md`，并在 `CHANGELOG.md` 顶部登记同一版本。
- 执行推送或部署前必须运行 `powershell -File scripts/verify-version-note.ps1`；校验失败时不得推送或部署。
- 发布包必须通过 `scripts/build-release.ps1` 生成；脚本会执行版本记录校验，并把 `CHANGELOG.md`、`changes/` 和本规则复制到 `dist/`。
- 版本记录必须具体说明本次的功能、修复、性能、兼容性和验证结果；不允许只写“若干优化”。

