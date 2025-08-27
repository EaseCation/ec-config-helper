# LotteryWikiTab 工作原理

LotteryWikiTab 用于将抽奖配置导出成 Wiki 表格，主要流程如下：

1. 读取 Notion 数据库中的抽奖记录。
2. 若上传本地 JSON 抽奖箱配置，则同名项目会覆盖 Notion 数据。
3. 获取商品与抽奖箱名称。
4. 名称来源的优先级：Notion > 语言库(cfgLanguage) > 密室杀手 merchandise.json。
5. 合并所有信息并生成概率表、CSV 与 Markdown，供下载或复制。

## 文件来源说明
- JSON 抽奖箱配置：`CodeFunCore\CodeFunCore\src\main\resources\net\easecation\codefuncore\lottery\exchange` 目录下的文件。
- 语言库：`cfgLanguage` 数据库导出的 JSON。
- 密室杀手商品：`CodeFunCore\CodeFunCore\src\main\resources\net\easecation\codefuncore\unlockupgrade\mm\merchandise.json`。
