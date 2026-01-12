const BACKEND_URL = 'http://localhost:8003';

class AgentChat {
    constructor() {
        this.messages = document.getElementById('messages');
        this.form = document.getElementById('chatForm');
        this.input = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.status = document.getElementById('status');
        
        this.initializeEventListeners();
        this.loadFiles();
        this.checkBackendStatus();
    }
    
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    async checkBackendStatus() {
        try {
            const response = await fetch(`${BACKEND_URL}/health`);
            if (response.ok) {
                this.updateStatus('🟢 Connected', 'connected');
            } else {
                this.updateStatus('🔴 Backend Error', 'error');
            }
        } catch (error) {
            this.updateStatus('🔴 Disconnected', 'error');
        }
    }
    
    updateStatus(text, className) {
        this.status.textContent = text;
        this.status.className = `status ${className}`;
    }
    
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        this.addMessage(message, 'user');
        this.input.value = '';
        this.setLoading(true);
        
        try {
            const response = await fetch(`${BACKEND_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: message,
                    max_turns: 20
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.addMessage(result.response, 'assistant');
                // Refresh files after each query in case new files were generated
                setTimeout(() => this.loadFiles(), 2000);
            } else {
                this.addMessage(`Error: ${result.error || 'Unknown error'}`, 'assistant error');
            }
        } catch (error) {
            this.addMessage(`Connection error: ${error.message}`, 'assistant error');
            this.updateStatus('🔴 Connection Error', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    setLoading(loading) {
        this.sendButton.disabled = loading;
        const sendText = this.sendButton.querySelector('.send-text');
        const loadingSpan = this.sendButton.querySelector('.loading');
        
        if (loading) {
            sendText.style.display = 'none';
            loadingSpan.style.display = 'inline';
        } else {
            sendText.style.display = 'inline';
            loadingSpan.style.display = 'none';
        }
    }
    
    async loadFiles() {
        try {
            const response = await fetch(`${BACKEND_URL}/files`);
            const result = await response.json();
            
            this.displayFiles(result.files || []);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }
    
    displayFiles(files) {
        const filesList = document.getElementById('filesList');
        
        if (files.length === 0) {
            filesList.innerHTML = '<p class="no-files">No files generated yet</p>';
            return;
        }
        
        filesList.innerHTML = files.map(file => `
            <div class="file-item">
                <span class="file-name" title="${file.filename}">${file.filename}</span>
                <a href="${BACKEND_URL}/files/${file.filename}" 
                   class="download-btn" 
                   download="${file.filename}"
                   target="_blank">
                   ⬇️ Download
                </a>
            </div>
        `).join('');
    }
}

// Global function for refresh button
function loadFiles() {
    if (window.agentChat) {
        window.agentChat.loadFiles();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.agentChat = new AgentChat();
});