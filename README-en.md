English | [简体中文](./README.md)

## BabelDuck

BabelDuck is a web application designed for language learners with relatively weak oral expression skills, aiming to minimize the barriers and cognitive load of language practice through AI conversations.

### 🌐 Live Demo

[BabelDuck](https://duck.orenoid.com/)

### 🚀 Key Features

- Common AI conversation features including multiple chat management, customizable system prompts, and streaming responses
- Seek AI assistance for grammar, translation, or expression refinement without interrupting the current conversation, with customizable quick instructions
- Start branch conversations to further discuss AI suggestions when needed, and seamlessly return to the original conversation afterward
- Support for voice input and response
- Integration with multiple LLM AI services with seamless switching
- Local data storage to ensure user data privacy and security
- Multilingual interface

### 🛠️ Deployment

1. Install Docker
2. Clone the repository
3. Rename `.env.example` to `.env` and fill in the relevant configurations
4. Run `docker run -d --name babel-duck --env-file .env -p 9000:9000 orenoid/babel-duck:latest`
5. Visit `http://localhost:9000` to see the result 