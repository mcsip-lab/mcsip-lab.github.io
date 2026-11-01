# 多媒体内容安全与智能感知实验室

本仓库包含实验室主页的公开静态页面，用于 GitHub Pages 发布。成员资料、论文、代码和图片来源入口均保留在网页中。

发布目录只包含公开网页及必要资产，不包含数据库、后台、运行配置或设计草稿。维护源项目与静态导出工具保留在本地开发项目中。

更新网站时，在维护项目中运行：

```powershell
.\.venv\Scripts\python.exe tools/export_static.py --base-path /
```

将生成的 `build/github-pages/` 内容同步到本仓库。GitHub Pages 的发布来源应设置为 `main` 分支的根目录。
