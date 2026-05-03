import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
 
  // RupantorPay Verification Proxy
  app.get("/api/verify-payment", async (req, res) => {
    try {
      const { payment_id, apiKey, verifyUrl, siteDomain } = req.query;

      if (!payment_id || !apiKey || !verifyUrl) {
        return res.status(400).json({ success: false, message: "Missing verification parameters" });
      }

      // Smart Host Detection - Prioritize siteDomain if provided
      let rawHost = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
      let host: string = Array.isArray(rawHost) ? rawHost[0] : (rawHost as string);
      host = host.split(':')[0]; // Base host from current request

      if (siteDomain && typeof siteDomain === 'string' && siteDomain.trim() !== '') {
        try {
          const cleanDomain = siteDomain.replace(/\/$/, '').replace(/^https?:\/\//, '');
          host = cleanDomain.split('/')[0].split(':')[0];
        } catch (e) {
          host = (siteDomain as string).split('/')[0].split(':')[0];
        }
      }

      const targetUrl = `${verifyUrl}?payment_id=${payment_id}`;
      console.log(`[RupantorPay] Verifying: ${targetUrl} | Host: ${host}`);

      const response = await fetch(targetUrl, {
        headers: {
          'X-API-KEY': apiKey as string,
          'Content-Type': 'application/json',
          'X-CLIENT': host,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      });

      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        // Add detailed diagnostics if the API itself returns an error
        if (data.status === 'error' || data.success === false) {
           console.log(`[RupantorPay] API Error Detail:`, data);
        }
        res.json(data);
      } catch (e) {
        console.log(`[RupantorPay] Non-JSON Response:`, responseText.substring(0, 500));
        res.json({ 
          success: false, 
          message: "Invalid API Response", 
          detected_host: host,
          raw: responseText.substring(0, 500) 
        });
      }
    } catch (error) {
      console.error("[RupantorPay] Verification Error:", error);
      res.status(500).json({ success: false, message: "Server Verification Error" });
    }
  });

  // RupantorPay Checkout Proxy
  app.post("/api/create-checkout", async (req, res) => {
    try {
      const { amount, metadata, apiKey, apiUrl, siteDomain } = req.body;

      if (!amount || !apiKey || !apiUrl) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
      }

      // Determine host for X-CLIENT
      let host = siteDomain || '';
      if (host.includes('://')) {
        host = host.split('://')[1];
      }
      host = host.split('/')[0].split(':')[0]; // Pure domain

      if (!host || host === 'localhost') {
        let rawHost = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
        host = Array.isArray(rawHost) ? rawHost[0] : (rawHost as string);
        host = host.split(':')[0];
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;

      const payload = {
        success_url: `${baseUrl}/?payment_success=1`,
        cancel_url: `${baseUrl}/?payment_cancel=1`,
        webhook_url: `${baseUrl}/?webhook=1`,
        amount: amount.toString(),
        metadata: metadata || {}
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey as string,
          'Content-Type': 'application/json',
          'X-CLIENT': host,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(payload)
      });

      const responseStatus = response.status;
      const responseText = await response.text();
      
      console.log(`[RupantorPay] Response Status: ${responseStatus}`);

      try {
        const data = JSON.parse(responseText);
        res.json(data);
      } catch (e) {
        res.status(responseStatus).json({ 
          status: "error",
          success: false, 
          message: "Gateway Error (Response is not JSON)", 
          details: responseText.substring(0, 500),
          detected_host: host
        });
      }
    } catch (error) {
      console.error("[RupantorPay] Proxy Error:", error);
      res.status(500).json({ success: false, message: "Server Proxy Error" });
    }
  });

  // API Proxy Route to bypass CORS
  app.get("/api/proxy", async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ success: false, status: "Missing target URL" });
      }

      console.log(`Proxying request to: ${url}`);

      const response = await fetch(url as string);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (parseError) {
        console.error("JSON Parse Error in Proxy:", parseError, "Raw Response:", text);
        // If it's not JSON, might be a success message as plain text or a 200 OK with success content
        if (text.toLowerCase().includes("success") || text.includes('"success":true')) {
            res.json({ success: true, message: text });
        } else {
            res.status(503).json({ success: false, status: "API response was not valid JSON", raw: text.substring(0, 100) });
        }
      }
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ success: false, status: "Server Proxy Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
