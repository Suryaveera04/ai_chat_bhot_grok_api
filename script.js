class ChatApp {
    constructor() {
        this.conversations = JSON.parse(localStorage.getItem('conversations')) || [];
        this.currentConversationId = null;
        this.isLoading = false;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.autoSendTimer = null;
        this.isMuted = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConversations();
        this.initializeTheme();
        this.initializeSpeech();
    }

    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.conversationsList = document.getElementById('conversationsList');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.stopSpeechBtn = document.getElementById('stopSpeechBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.stopSpeechBtn.addEventListener('click', () => this.stopSpeech());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.toggleSendButton();
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !this.sidebar.contains(e.target) && 
                !this.sidebarToggle.contains(e.target)) {
                this.sidebar.classList.remove('open');
            }
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    toggleSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasText || this.isLoading;
    }

    startNewChat() {
        this.currentConversationId = this.generateId();
        this.clearChat();
        this.updateConversationsList();
        this.sidebar.classList.remove('open');
    }

    clearChat() {
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to AI Assistant</h3>
                <p>How can I help you today?</p>
            </div>
        `;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        // Clear auto-send timer if manually sending
        if (this.autoSendTimer) {
            clearTimeout(this.autoSendTimer);
            this.autoSendTimer = null;
        }

        this.hideError();
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.adjustTextareaHeight();
        this.toggleSendButton();

        if (!this.currentConversationId) {
            this.currentConversationId = this.generateId();
        }

        this.showLoading();
        
        try {
            const response = await this.callAPI(message);
            this.hideLoading();
            this.addMessage(response, 'ai');
            this.saveConversation(message, response);
            this.speakText(response);
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to get response. Please try again.');
            console.error('API Error:', error);
        }
    }

    addMessage(content, type) {
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'ai') {
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = this.escapeHtml(content);
            
            const muteBtn = document.createElement('button');
            muteBtn.className = 'mute-btn';
            muteBtn.textContent = '🔊';
            muteBtn.title = 'Mute';
            muteBtn.addEventListener('click', () => this.toggleMuteForMessage(muteBtn, content));
            
            messageContent.appendChild(muteBtn);
            messageDiv.appendChild(messageContent);
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(content)}</div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async callAPI(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    saveConversation(userMessage, aiResponse) {
        let conversation = this.conversations.find(c => c.id === this.currentConversationId);
        
        if (!conversation) {
            conversation = {
                id: this.currentConversationId,
                title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
                messages: [],
                timestamp: Date.now()
            };
            this.conversations.unshift(conversation);
        }

        conversation.messages.push(
            { type: 'user', content: userMessage, timestamp: Date.now() },
            { type: 'ai', content: aiResponse, timestamp: Date.now() }
        );

        if (this.conversations.length > 50) {
            this.conversations = this.conversations.slice(0, 50);
        }

        localStorage.setItem('conversations', JSON.stringify(this.conversations));
        this.updateConversationsList();
    }

    loadConversations() {
        this.updateConversationsList();
    }

    updateConversationsList() {
        this.conversationsList.innerHTML = '';
        
        this.conversations.forEach(conversation => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (conversation.id === this.currentConversationId) {
                item.classList.add('active');
            }
            item.textContent = conversation.title;
            item.addEventListener('click', () => this.loadConversation(conversation.id));
            this.conversationsList.appendChild(item);
        });
    }

    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        this.clearChat();

        conversation.messages.forEach(message => {
            this.addMessage(message.content, message.type);
        });

        this.updateConversationsList();
        this.sidebar.classList.remove('open');
    }

    showLoading() {
        this.isLoading = true;
        this.loadingIndicator.style.display = 'block';
        this.toggleSendButton();
    }

    hideLoading() {
        this.isLoading = false;
        this.loadingIndicator.style.display = 'none';
        this.toggleSendButton();
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        this.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initializeSpeech() {
        console.log('Initializing speech...');
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('Speech recognition supported');
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.voiceBtn.classList.add('listening');
                this.voiceBtn.textContent = '🔴';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.adjustTextareaHeight();
                this.toggleSendButton();
                
                // Auto-send after 3 seconds
                if (this.autoSendTimer) {
                    clearTimeout(this.autoSendTimer);
                }
                this.autoSendTimer = setTimeout(() => {
                    this.sendMessage();
                }, 3000);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.voiceBtn.classList.remove('listening');
                this.voiceBtn.textContent = '🎤';
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.voiceBtn.classList.remove('listening');
                this.voiceBtn.textContent = '🎤';
            };
        } else {
            console.log('Speech recognition not supported');
            this.voiceBtn.title = 'Voice input not supported in this browser';
            this.voiceBtn.style.opacity = '0.5';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    speakText(text) {
        if (this.synthesis) {
            this.synthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
                this.stopSpeechBtn.style.display = 'flex';
            };
            
            utterance.onend = () => {
                this.stopSpeechBtn.style.display = 'none';
            };
            
            this.synthesis.speak(utterance);
        }
    }

    stopSpeech() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.stopSpeechBtn.style.display = 'none';
        }
    }

    toggleMuteForMessage(button, text) {
        if (button.textContent === '🔊') {
            button.textContent = '🔇';
            button.title = 'Unmute and play';
            this.stopSpeech();
        } else {
            button.textContent = '🔊';
            button.title = 'Mute';
            this.speakSpecificText(text);
        }
    }

    speakSpecificText(text) {
        if (this.synthesis) {
            this.synthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
                this.stopSpeechBtn.style.display = 'flex';
            };
            
            utterance.onend = () => {
                this.stopSpeechBtn.style.display = 'none';
            };
            
            this.synthesis.speak(utterance);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});