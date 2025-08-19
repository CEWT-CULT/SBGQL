const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Proxy endpoint for Superbolt GraphQL API
app.post('/api/superbolt-proxy', async (req, res) => {
    try {
        console.log('🔍 Proxy request received:', {
            method: req.method,
            body: req.body,
            headers: req.headers
        });

        const { query, variables } = req.body;

        if (!query) {
            return res.status(400).json({ 
                error: 'Missing GraphQL query',
                message: 'Query parameter is required' 
            });
        }

        console.log('🔍 Forwarding to Superbolt GraphQL:', {
            query: query.substring(0, 100) + '...',
            variables
        });

        // Forward the request to Superbolt
        const response = await fetch('https://api.superbolt.wtf/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'CEWT-Cult-Proxy/1.0'
            },
            body: JSON.stringify({ query, variables })
        });

        console.log('🔍 Superbolt response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Superbolt API error:', {
                status: response.status,
                statusText: response.statusText,
                errorText
            });
            
            return res.status(response.status).json({
                error: 'Superbolt API error',
                status: response.status,
                statusText: response.statusText,
                details: errorText
            });
        }

        const data = await response.json();
        
        console.log('✅ Proxy request successful, returning data');
        
        // Return the data from Superbolt
        res.json(data);

    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({
            error: 'Proxy error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'CEWT Cult Superbolt Proxy'
    });
});

// Serve the main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/ICS721.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ICS721.html'));
});

// Export for Vercel serverless
module.exports = app;

// Only start server if running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🦎 CEWT Cult server running on port ${PORT}`);
        console.log(`🔍 Superbolt proxy available at: http://localhost:${PORT}/api/superbolt-proxy`);
        console.log(`🌐 Main site: http://localhost:${PORT}`);
    });
}
