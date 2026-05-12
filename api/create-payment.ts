import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const GATEWAY_CONFIG = {
  baseUrl: 'https://api.watchpays.com/v1/create',
  merchantId: process.env.WATCHPAYS_MERCHANT_ID || '100555238',
  apiKey: process.env.WATCHPAYS_API_KEY || '8f0b68cd9c73c0db0131d86da6def792',
};

function generateSignature(merchant_id: string, amount: string, merchant_order_no: string, callback_url: string, apiKey: string) {
  const params: any = {};
  if (merchant_id) params.merchant_id = merchant_id;
  if (amount) params.amount = amount;
  if (merchant_order_no) params.merchant_order_no = merchant_order_no;
  if (callback_url) params.callback_url = callback_url;

  const sortedKeys = Object.keys(params).sort();

  let signStr = '';
  for (const key of sortedKeys) {
    signStr += `${key}=${params[key]}&`;
  }

  signStr += `key=${apiKey}`;

  return createHash('md5').update(signStr).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerId, packageId, amount, price, name, email, phone } = req.body;

    if (!playerId || !packageId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cardinguc.com';
    const callbackUrl = siteUrl;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const merchantOrderNo = `ORD${Date.now()}${randomSuffix}`;

    const formattedAmount = parseFloat(price).toFixed(2);

    const signature = generateSignature(
      GATEWAY_CONFIG.merchantId,
      formattedAmount,
      merchantOrderNo,
      callbackUrl,
      GATEWAY_CONFIG.apiKey
    );

    const requestBody = {
      merchant_id: GATEWAY_CONFIG.merchantId,
      api_key: GATEWAY_CONFIG.apiKey,
      amount: formattedAmount,
      merchant_order_no: merchantOrderNo,
      callback_url: callbackUrl,
      extra: `${playerId}`,
      signature: signature,
    };

    console.log(`[create-payment] Creating WatchPays payment for Player: ${playerId}, Amount: ₹${formattedAmount}, OrderNo: ${merchantOrderNo}`);

    const response = await fetch(GATEWAY_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data: any = await response.json();
    console.log(`[create-payment] WatchPays response:`, JSON.stringify(data));

    if (data.success === true && data.payment_url) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.payment_url,
        method: 'redirect',
      });
    } else {
      console.error(`[create-payment] WatchPays error:`, data.message || JSON.stringify(data));
      return res.status(200).json({
        success: false,
        error: data.message || 'Payment gateway temporarily unavailable. Please try again.',
      });
    }
  } catch (error) {
    console.error('[create-payment] Error:', error);
    return res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
}
