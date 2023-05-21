const express = require('express');
const mongoose = require('mongoose');
const ShortId = require('shortid');
const validUrl = require('valid-url');

const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());


// Configuração do banco de dados
mongoose.connect('mongodb://localhost/url-shortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UrlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    default: ShortId.generate,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Url = mongoose.model('Url', UrlSchema);

// Rotas da API
app.post('/api/shorten', async (req, res) => {
  const { originalUrl } = req.body;

  // Verifica se a URL fornecida é válida
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  try {
    // Verifica se a URL já foi encurtada antes
    let url = await Url.findOne({ originalUrl });

    if (url) {
      return res.json(url);
    }

    // Cria uma nova URL encurtada
    url = new Url({ originalUrl });

    await url.save();

    res.json(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  
  try {
    const url = await Url.findOne({ shortUrl: shortUrl });
    console.log(url);
    
    
    if (url) {
      // Aumentar o contador de cliques
      url.clicks++;
      await url.save();
      
      // Redirecionar para a URL original
      res.redirect(url.originalUrl);
    } else {
      res.status(404).send('URL not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
   }
});



app.get('/api/urls', async (req, res) => {
  try {
    // Obtém todas as URLs encurtadas e seus contadores de cliques
    const urls = await Url.find({}, 'originalUrl shortUrl clicks');

    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
