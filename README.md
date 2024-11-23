[English](./README-en.md) | 简体中文

## BabelDuck

BabelDuck 是一个面向各水平层次语言学习者的高度可定制化 AI 口语对话练习应用，并对初学者更友好，旨在将口语表达练习的门槛与心智负担降至最低。

### 🌐 在线体验

[BabelDuck](https://duck.orenoid.com/)


### 🚀 主要功能

- 支持多对话管理、自定义系统提示词、流式响应等常见 AI 对话功能
- 可在不影响当前对话的前提下，向 AI 寻求语法、翻译或表达润色等建议，并提供可定制化的快捷指令
- 在对 AI 提供的建议有疑问时，可开启分支对话进一步讨论，讨论结束后可无缝返回原对话
- 支持语音输入与响应
- 集成多种 LLM AI 服务，可无缝切换
- 数据存储于本地，确保用户数据隐私安全
- 提供多语言界面

### 🛠️ 部署

1. 安装 Docker
2. 克隆仓库到本地
3. 将 `.env.example` 文件重命名为 `.env`，并填入相关配置
4. 运行 `docker run -d --name babel-duck --env-file .env -p 9000:9000 orenoid/babel-duck:latest`
5. 访问 `http://localhost:9000` 查看效果
