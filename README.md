[English](./README-en.md) | 简体中文

<h1 align="center">
  <img src=".github/assets/images/babel-duck-logo.png" alt="BabelDuck Logo" height="40"/>
  BabelDuck
</h1>

<br/>

<div align="center">
  <p align="center"> <img width="900" alt="BabelDuck Grammar Check" src=".github/assets/images/README-zh-grammar-check.png"> </p>
</div>

<br/>

### 📖 改动介绍

原项目地址[BabelDuck](https://github.com/Orenoid/BabelDuck)。

改动的目的是尽可能使用本地服务，免去各种服务注册及购买，以及加快响应速度。

目前改动主要是：

1. STT服务使用本地部署 （已完成）
2. TTS服务使用本地部署（未完成）

### 前置准备

1. 大语言模型api key必须，可考虑openai,deepseek，qwen等(必须）
2. 微软azure 文字转语音 （可选）
3. 本地STT需要GPU（无GPU速度慢，延迟高，可在docker-compose.yml中把DEVICE参数改为cpu

### 🛠 部署

1. 安装 Docker
2. 克隆仓库到本地
```shell
git clone https://github.com/Orenoid/BabelDuck
```
3. 将 `.env.example` 文件重命名为 `.env`，并填入相关配置
4. 运行 Docker 容器
```shell
docker compose up
```
5. 访问 `http://localhost:9000` 查看效果

### 📄 许可证
本项目采用 [LICENSE](https://github.com/Orenoid/BabelDuck/blob/main/LICENSE)，详情请参阅 LICENSE 文件。
