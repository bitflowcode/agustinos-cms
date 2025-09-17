// api/video-upload.js — Subida directa a Bunny CDN con límite de 50MB
module.exports = async (req, res) => {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: Generar token para videos hasta 50MB
  if (req.method === 'POST') {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `video_${timestamp}_${randomId}.mp4`;
      
      const token = Buffer.from(JSON.stringify({
        filename,
        timestamp,
        expires: timestamp + (15 * 60 * 1000) // 15 minutos
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

  // PUT: Subir video directamente (máximo 50MB por limitación de Vercel)
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

      // Streaming directo a Bunny CDN (sin cargar en memoria)
      console.log(`[video-upload] Starting streaming upload to Bunny CDN`);
      
      // Subir a Bunny CDN Storage con streaming directo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos timeout
      
      try {
        const bunnyResponse = await fetch(`https://storage.bunnycdn.com/agustinos/videos/${tokenData.filename}`, {
          method: 'PUT',
          headers: {
            'AccessKey': process.env.BUNNY_ACCESS_KEY,
            'Content-Type': 'video/mp4',
          },
          body: req, // Stream directo del request
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!bunnyResponse.ok) {
          const errorText = await bunnyResponse.text().catch(() => '');
          console.error(`[video-upload] Bunny CDN error: ${bunnyResponse.status} - ${errorText}`);
          throw new Error(`Bunny CDN upload failed: ${bunnyResponse.status} - ${errorText}`);
        }

        const finalUrl = `https://agustinos.b-cdn.net/videos/${tokenData.filename}`;
        console.log(`[video-upload] Video uploaded successfully: ${finalUrl}`);
        
        return res.status(200).json({
          success: true,
          videoUrl: finalUrl,
          filename: tokenData.filename
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - el archivo es muy grande o la conexión es lenta');
        }
        throw error;
      }

    } catch (error) {
      console.error('[video-upload] Error uploading video:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al subir video', 
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
