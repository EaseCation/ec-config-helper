# LotteryWikiTab.tsx 工作原理详解

## 概述

`LotteryWikiTab.tsx` 是一个复杂的抽奖配置处理组件，它从 Notion 数据库获取抽奖箱配置数据，经过多层转换和计算，最终生成符合 Wiki 语法的表格格式。整个系统支持多层嵌套抽奖箱、保底机制、概率计算等高级功能。

## 工作流程图

```
Notion API → 数据清洗 → 格式化转换 → 名称翻译 → Wiki表格生成 → UI展示
    ↓           ↓          ↓          ↓         ↓          ↓
原始页面数据   过滤分组    WikiResult   中文名称   表格字符串   可折叠面板
```

## 详细工作流程

### 1. 数据获取阶段

**输入数据类型：** `NotionPage[]` (Notion API 返回的页面数组)

**关键属性映射：**
```typescript
// 从 Notion 页面属性中提取的关键字段
const boxId = parseRelation(page.properties['所在抽奖箱']);        // 抽奖箱ID (关系类型)
const id = String(flatProperty(page.properties['exchange_id'])); // 兑换ID (文本类型)
const disabled = parseCheckbox(page.properties['禁用']);         // 是否禁用 (复选框类型)
```

**Notion 原始数据结构示例：**
```typescript
{
  id: "page_id_123",
  properties: {
    '所在抽奖箱': { type: 'relation', relation: [{ id: 'box_1' }] },
    'exchange_id': { type: 'rich_text', rich_text: [{ text: { content: '1.0' } }] },
    '禁用': { type: 'checkbox', checkbox: false },
    '权重': { type: 'number', number: 100 },
    '商品全称': { type: 'rich_text', rich_text: [{ text: { content: '钻石' } }] },
    '数量': { type: 'number', number: 10 },
    '保底？': { type: 'checkbox', checkbox: false },
    '展示到wiki？': { type: 'checkbox', checkbox: true }
  }
}
```

### 2. 数据过滤和分组阶段

**过滤条件：**
- 跳过禁用的项目 (`parseCheckbox(page.properties['禁用'])`)
- 必须有抽奖箱ID和兑换ID

**分组逻辑：**
```typescript
// 按抽奖箱分组，一个项目可能属于多个抽奖箱
const grouped: Record<string, NotionPage[]> = {};
// 例如：{ "box_1": [page1, page2], "box_2": [page3] }
```

### 3. 数据格式化转换阶段

**调用 `formatLottery()` 函数，输出 `WikiResult` 类型：**

```typescript
interface WikiResult {
  name: string;           // Wiki显示名称，如 "抽奖箱1"
  exc: string;            // 兑换ID，如 "exc_lottery_1_0"
  display: boolean;       // 是否显示到Wiki
  fallbackTimes: number;  // 保底触发次数，如 10
  gain: WikiGainItem[];   // 奖品列表
}

interface WikiGainItem {
  weight: number;         // 权重，如 100
  exc?: string;           // 子抽奖箱ID（可选）
  fallback?: boolean;     // 是否保底（可选）
  name?: string;          // 商品名称（可选）
  data?: number;          // 商品数量（可选）
}
```

**转换示例：**
```typescript
// 输入：Notion页面数组
// 输出：WikiResult对象
{
  name: "新手抽奖箱",
  exc: "exc_lottery_1_0",
  display: true,
  fallbackTimes: 10,
  gain: [
    { weight: 80, name: "钻石", data: 100 },
    { weight: 15, name: "金币", data: 1000 },
    { weight: 5, exc: "exc_lottery_2_0", fallback: true }
  ]
}
```

### 4. 名称翻译处理阶段

**商品名称映射：**
```typescript
// 从 commodityNameService 获取商品名称映射
const nameMap: Record<string, string> = {
  "diamond": "钻石",
  "gold": "金币",
  "gem": "宝石"
};

// 应用翻译
// 获取商品名称和抽奖箱名称映射
const [nameMap, boxNameMap] = await Promise.all([
  fetchCommodityNameMap(),
  fetchLotteryBoxNameMap()
]);

// 在格式化阶段统一翻译
const map = buildWikiTables(wikiMap, nameMap, boxNameMap);
```

### 5. Wiki表格格式化阶段

**调用 `buildWikiTables()` 函数，经过多层转换：**

#### 第一层：`formatWikiSingleGain()` - 递归展开所有奖品

```typescript
interface FlatItem {
  weight: number;    // 计算后的权重
  name: string;      // 商品名称
  data: number;      // 数量
  fallback: boolean; // 是否保底
}

// 递归处理嵌套抽奖箱，计算最终权重
// 例如：主抽奖箱权重100，子抽奖箱权重50，则子抽奖箱中每个奖品权重 = 50/100 * 100 = 50
```

**递归逻辑：**
- 如果奖品项有 `exc` 属性（子抽奖箱），递归调用自身
- 合并相同商品的权重
- 计算最终权重比例

#### 第二层：`formatWikiChance()` - 计算概率

```typescript
interface ChanceItem {
  name: string;   // 商品名称
  data: number;   // 数量
  chance: string; // 概率字符串，如 "5.000%" 或 "保底"
}

// 计算每个奖品的概率：weight / totalWeight * 100
// 保底物品显示 "保底" 而不是具体概率
```

#### 第三层：`formatWikiToString()` - 生成Wiki表格字符串

**输出格式示例：**
```markdown
= 新手抽奖箱 =
抽取 10 次后触发抽奖保底，会按照玩家商品拥有情况给予某一个保底奖励（保底商品会在"概率"一列中标注"保底"）。

{| class="wikitable sortable"
!奖励内容
!奖励数量
!概率
|-
|钻石
|100
|80.000%
|-
|金币
|1000
|15.000%
|-
|神秘宝箱
|1
|保底
|}
```

### 6. 最终展示阶段

**数据结构：**
```typescript
const tables: Record<string, string> = {
  "新手抽奖箱": "= 新手抽奖箱 =\n抽取 10 次后...",
  "高级抽奖箱": "= 高级抽奖箱 =\n抽取 20 次后..."
};
```

**UI展示：**
- 使用 Ant Design 的 `Collapse` 组件
- 每个抽奖箱一个可折叠面板
- 支持一键复制Wiki表格内容

## 核心算法详解

### 权重计算算法

```typescript
// 递归权重计算示例
function calculateWeight(mainWeight: number, subWeight: number, totalSubWeight: number): number {
  if (totalSubWeight > 0) {
    return (subWeight / totalSubWeight) * mainWeight;
  }
  return subWeight;
}

// 实际应用
// 主抽奖箱权重：100
// 子抽奖箱权重：50
// 子抽奖箱总权重：100
// 最终权重：50/100 * 100 = 50
```

### 概率计算算法

```typescript
// 概率计算
const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
const chance = (item.weight / totalWeight) * 100;

// 格式化概率显示
if (chance < 0.001) {
  return '0.001'; // 最小显示精度
} else {
  return chance.toFixed(3); // 保留3位小数
}
```

## 数据结构关系图

```
NotionPage[] → WikiResult[] → FlatItem[] → ChanceItem[] → Wiki字符串
     ↓              ↓           ↓           ↓           ↓
  原始数据      标准化数据    扁平化数据    概率数据    最终输出
```

## 特殊功能特性

### 1. 嵌套抽奖箱支持
- 支持无限层级的抽奖箱嵌套
- 自动计算权重传递和概率分布
- 递归处理复杂抽奖逻辑

### 2. 保底机制
- 支持设置保底触发次数
- 保底物品在概率列显示"保底"
- 保底逻辑与普通抽奖逻辑分离

### 3. 多语言支持
- 商品名称自动翻译（英文→中文）
- 抽奖箱名称本地化
- 支持国际化扩展

### 4. 数据验证
- 自动过滤无效数据
- 权重计算验证
- 概率总和验证

## 性能优化

### 1. 批量处理
- 一次性获取所有Notion数据
- 批量应用名称翻译
- 减少API调用次数

### 2. 缓存机制
- 商品名称映射缓存
- 抽奖箱名称映射缓存
- 避免重复计算

### 3. 异步处理
- 并行获取名称映射
- 非阻塞UI渲染
- 错误处理机制

## 错误处理

### 1. 数据完整性检查
```typescript
// 检查必要字段
if (!boxId || !id) continue;

// 验证权重数据
if (item.weight < 0) {
  console.warn('权重不能为负数:', item);
  continue;
}
```

### 2. 异常情况处理
```typescript
try {
  // 主要逻辑
} catch (err) {
  console.error(err);
  messageApi.error('获取 Lottery 数据失败');
} finally {
  setLoading(false);
}
```

## 扩展性设计

### 1. 插件化架构
- 支持自定义格式化器
- 可扩展的概率计算算法
- 灵活的UI组件配置

### 2. 配置驱动
- 通过Notion属性控制显示逻辑
- 支持动态配置调整
- 无需代码修改即可调整行为

## 总结

`LotteryWikiTab.tsx` 是一个设计精良的抽奖配置处理系统，它通过以下特点实现了复杂业务逻辑的简化：

1. **数据驱动**：所有配置通过Notion数据库管理，无需代码修改
2. **递归处理**：支持复杂的嵌套抽奖箱结构
3. **智能计算**：自动处理权重传递和概率计算
4. **用户友好**：提供直观的Wiki格式输出和复制功能
5. **高度可扩展**：支持多种抽奖模式和配置选项

这个系统特别适合需要复杂抽奖逻辑的游戏或应用，能够将复杂的抽奖配置转换为清晰易懂的Wiki文档，大大提高了配置的可读性和维护性。
