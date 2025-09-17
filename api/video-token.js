// api/video-token.js — Subida completa de videos a Bunny CDN (solución local)
module.exports = async (req, res) => {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: Generar token
  if (req.method === 'POST') {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `video_${timestamp}_${randomId}.mp4`;
      
      const token = Buffer.from(JSON.stringify({
        filename,
        timestamp,
        expires: timestamp + (10 * 60 * 1000) // 10 minutos
      })).toString('base64');

      const finalUrl = `https://agustinos.b-cdn.net/videos/${filename}`;

      return res.status(200).json({
        token,
        finalUrl
      });
    } catch (error) {
      console.error('Error generating video token:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT: Subir video directamente a Bunny CDN
  if (req.method === 'PUT') {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: 'Token requerido' });
      }

      // Decodificar token
      let tokenData;
      try {
        tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      } catch (e) {
        return res.status(400).json({ error: 'Token inválido' });
      }

      // Verificar expiración
      if (Date.now() > tokenData.expires) {
        return res.status(400).json({ error: 'Token expirado' });
      }

      // Leer el body como buffer (streaming)
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      
      console.log(`[video-token] Uploading ${fileBuffer.length} bytes to Bunny CDN`);
      
      // Subir a Bunny CDN Storage
      const bunnyResponse = await fetch(`https://storage.bunnycdn.com/agustinos/videos/${tokenData.filename}`, {
        method: 'PUT',
        headers: {
          'AccessKey': process.env.BUNNY_ACCESS_KEY,
          'Content-Type': 'video/mp4',
        },
        body: fileBuffer,
      });

      if (!bunnyResponse.ok) {
        const errorText = await bunnyResponse.text().catch(() => '');
        console.error(`[video-token] Bunny CDN error: ${bunnyResponse.status} - ${errorText}`);
        throw new Error(`Bunny CDN upload failed: ${bunnyResponse.status} - ${errorText}`);
      }

      const finalUrl = `https://agustinos.b-cdn.net/videos/${tokenData.filename}`;
      console.log(`[video-token] Video uploaded successfully: ${finalUrl}`);
      
      return res.status(200).json({
        success: true,
        videoUrl: finalUrl,
        filename: tokenData.filename
      });

    } catch (error) {
      console.error('[video-token] Error uploading video:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al subir video', 
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};