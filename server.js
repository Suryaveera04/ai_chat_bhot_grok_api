require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
    console.log('=== API CHAT REQUEST RECEIVED ===');
    try {
        const { message } = req.body;
        console.log('Received message:', message);
        
        if (!message) {
            console.log('No message provided');
            return res.status(400).json({ error: 'No message provided' });
        }
        
        const API_KEY = process.env.GROQ_API_KEY;
        
        const requestBody = {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 1024
        };
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        console.log('Sending request to Groq API...');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            return res.status(500).json({ error: `API Error: ${response.status} - ${errorText}` });
        }

        const data = await response.json();
        console.log('API Response received:', JSON.stringify(data, null, 2));
        
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            console.log('Sending successful response');
            res.json({ response: data.choices[0].message.content });
        } else {
            console.error('Invalid response structure:', data);
            res.status(500).json({ error: 'Invalid API response format' });
        }
    } catch (error) {
        console.error('=== SERVER ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
    console.log('=== END API CHAT REQUEST ===');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});