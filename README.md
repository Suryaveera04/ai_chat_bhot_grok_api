# AI Chat Bot with Groq API

A modern AI chatbot with voice capabilities powered by Groq API.

## Features

- 🤖 **AI Conversations**: Powered by Groq's Llama models
- 🎤 **Voice Input**: Speech-to-text for hands-free interaction
- 🔊 **Text-to-Speech**: AI responses are read aloud automatically
- ⏱️ **Auto-Send**: Voice messages auto-send after 3 seconds
- 🔇 **Speech Control**: Stop speech or mute/unmute individual messages
- 💬 **Conversation History**: Save and load previous conversations
- 🌙 **Dark/Light Theme**: Toggle between themes
- 📱 **Responsive Design**: Works on desktop and mobile

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Suryaveera04/ai_chat_bhot_grok_api.git
   cd ai_chat_bhot_grok_api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy your Groq API key to the `.env` file
   - The API key is already configured in the `.env` file

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open your browser**:
   - Go to `http://localhost:3000`

## Usage

### Text Input
- Type your message and press Enter or click Send

### Voice Input
- Click the 🎤 microphone button
- Speak your message
- It will auto-send after 3 seconds

### Speech Controls
- **Stop Speech**: Click 🔇 button to stop current speech
- **Mute Message**: Click 🔊 on any AI message to mute/unmute it
- **Replay Message**: Click 🔇 on a muted message to replay it

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI**: Groq API (Llama models)
- **Speech**: Web Speech API
- **Storage**: LocalStorage for conversations

## Browser Support

- Chrome (recommended)
- Edge
- Safari
- Firefox (limited speech support)

## API Models

Currently using Groq's `llama-3.1-8b-instant` model for fast responses.

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License