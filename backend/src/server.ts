import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT;

// Iniciando o servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse em: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;