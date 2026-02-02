# 🔮 Img-C-Base64 - 极简 Base64 转换工具

> 一个部署在 Cloudflare Workers 上的全栈图片转换工具。无需服务器，磨砂玻璃 UI，内置后台管理与 D1 数据统计。

## ✨ 项目亮点

* **零成本部署**：完全基于 Cloudflare Workers + D1 数据库，免费额度通常足够个人使用。
* **极致 UI**：精心调教的磨砂玻璃（Glassmorphism）风格，自适应背景，细腻动画。
* **双向转换**：
* 🖼️ **图片转 Base64**：支持拖拽上传、粘贴（Ctrl+V）、直链 URL 转换（自动解决跨域）。
* 📝 **Base64 转图片**：实时解码预览，支持下载。


* **安全后台**：
* 内置 Admin 管理面板，支持在线修改密码。
* **持久化登录**：登录一次，本地永久记住身份，首页自动显示悬浮入口。
* **可视化配置**：在线修改网站标题、背景图（支持实时大图预览）、透明度等。


* **数据统计**：记录总转换次数及今日访问 IP 数。
* **安全防护**：集成 Cloudflare Turnstile 人机验证，支持“每日仅验证一次”策略。

## 🛠️ 技术栈

* **后端**：Cloudflare Workers (JavaScript)
* **数据库**：Cloudflare D1 (SQLite)
* **前端**：原生 HTML + Tailwind CSS (CDN) + Alpine.js (CDN)

---

## 🚀 部署指南

### 第一步：准备数据库 (D1)

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages** -> **D1**。
2. 点击 **Create database**，命名为 `img-db` (或者你喜欢的名字)。
3. 进入数据库详情页，点击 **Console** 标签，**逐行执行**以下 SQL 语句来初始化表结构：

-- 1. 创建配置表
```sql
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
```

-- 2. 创建统计表
```sql
CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, action_type TEXT, created_at INTEGER);
```

-- 3. 写入默认配置 (默认密码: admin)
```sql
INSERT OR IGNORE INTO config (key, value) VALUES ('site_name', 'Base64 Pro');
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', 'admin');
INSERT OR IGNORE INTO config (key, value) VALUES ('bg_url', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop');
INSERT OR IGNORE INTO config (key, value) VALUES ('card_opacity', '0.8');
INSERT OR IGNORE INTO config (key, value) VALUES ('turnstile_enabled', 'false');

```

### 第二步：创建 Worker

1. 创建一个新的 Standard Worker。
2. **绑定数据库**：
* 进入 Worker 的 **Settings** -> **Variables**。
* 找到 **D1 Database Bindings**。
* **Variable name** 填入 `DB` (必须大写，与代码对应)。
* **Database** 选择刚才创建的 `img-db`。
* 点击 **Deploy** 保存。



### 第三步：部署代码

1. 点击 **Edit code**。
2. 将项目提供的 `worker.js` 代码完整粘贴进去。
3. 点击右上角 **Deploy**。

### 第四步：绑定域名 (重要)

由于 Cloudflare 默认的 `workers.dev` 域名在部分地区无法访问，且可能导致 Turnstile 验证异常：

1. 进入 Worker 的 **Settings** -> **Triggers**。
2. 点击 **Add Custom Domain**。
3. 绑定一个你自己托管在 Cloudflare 上的子域名（例如 `tool.yourdomain.com`）。

---

## ⚙️ 后台管理说明

1. **进入后台**：
* **方式一**：在浏览器地址栏直接访问 `https://你的域名/admin`。
* **方式二**：在首页连续点击左上角的“网站标题” 5 次。


2. **默认密码**：`admin`
3. **快捷入口**：
* 登录成功后，首页右下角会出现一个悬浮的 **Admin** 按钮，点击即可快速切换回后台，无需再次输入密码。



---

## 🛡️ 人机验证 (Turnstile) 配置

如果你担心接口被刷，可以开启 Cloudflare Turnstile：

1. 在 Cloudflare 侧边栏找到 **Turnstile**，添加一个站点。
2. 获取 **Site Key** 和 **Secret Key**。
3. 进入本项目的后台管理页面 -> **安全验证**。
4. 填入 Key 并勾选“启用”。
5. 推荐选择 **“每个 IP 每天仅一次”** 策略，兼顾安全与体验。

---

## ❓ 常见问题

**Q: 背景图预览显示不出来？**
A: 请确保填入的是**图片直链**（以 `.jpg`, `.png` 等结尾的 URL）。为了性能，项目不接受直接上传图片文件，请使用图床链接。

**Q: 只有管理员能看到右下角的按钮吗？**
A: 是的。按钮的显示逻辑是判断浏览器本地缓存（Local Storage）中是否有登录凭证。普通访客看不到这个按钮。

**Q: 忘记后台密码怎么办？**
A: 去 D1 数据库的 Console 执行 SQL 重置：

```sql
UPDATE config SET value = 'admin' WHERE key = 'admin_password';

```

---
