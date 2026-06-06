const express = require('express');
const app=  express();
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const documentRoutes = require('./routes/document');

const wordDocumentRoutes = require('./routes/wordDocument');
const { connectDb } = require('./db.js');



app.use(cors({
    origin: '*', 
    credentials: true
  }));
app.use(express.json());


connectDb()

app.get('/', (req, res) => {
    res.send('Doc-Git Sync Engine Running...');
  });
  


  app.use('/api/auth', authRoutes);


app.use('/api/word', wordDocumentRoutes);


app.use('/api/document', documentRoutes);

  app.post('/api/webhooks/google-doc-changes', (req, res) => {
    
    const channelId = req.headers['x-goog-channel-id'];
    const resourceState = req.headers['x-goog-resource-state']; 
    const resourceUri = req.headers['x-goog-resource-uri'];
  
    console.log(`\n⚡ Received Sync Alert from Google!`);
    console.log(`Channel ID: ${channelId}`);
    console.log(`Resource State: ${resourceState}`);
  
    
    res.status(200).send('Webhook Received');
  
   
    if (resourceState === 'update') {
      processDocumentSync(channelId);
    }
  });
  
  
  async function processDocumentSync(channelId) {
    console.log(`🔄 Triggering processing pipeline for channel: ${channelId}`);
   
  }
  
  const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => { // 🚀 Binds to all network interfaces
  console.log(`🚀 Back-end server live on port ${PORT}`);
});


