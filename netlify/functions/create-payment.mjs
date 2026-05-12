// WatchPays Payment Gateway Configuration
import { createHash } from 'crypto';

const GATEWAY_CONFIG = {
  baseUrl: 'https://api.watchpays.com/v1/create',
  merchantId: process.env.WATCHPAYS_MERCHANT_ID || '100555238',
  apiKey: process.env.WATCHPAYS_API_KEY || '8f0b68cd9c73c0db0131d86da6def792',
};

/**
 * Generate MD5 signature for WatchPays API
 * 
 * Exact steps from WatchPays docs:
 * Step 1: Prepare params — merchant_id, amount, merchant_order_no, callback_url
 * Step 2: Remove empty values
 * Step 3: Sort alphabetically → amount, callback_url, merchant_id, merchant_order_no
 * Step 4: Build string → amount=X&callback_url=X&merchant_id=X&merchant_order_no=X
 * Step 5: Append API key → ...&key=API_KEY
 * Step 6: MD5 hash → signature
 */
function generateSignature(merchant_id, amount, merchant_order_no, callback_url, apiKey) {
  // Step 1 & 2: Only these 4 params, remove empty values
  const params = {};
  if (merchant_id) params.merchant_id = merchant_id;
  if (amount) params.amount = amount;
  if (merchant_order_no) params.merchant_order_no = merchant_order_no;
  if (callback_url) params.callback_url = callback_url;

  // Step 3: Sort alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Step 4: Build string (key=value& for each, matching PHP: $k."=".$v."&")
  let signStr = '';
  for (const key of sortedKeys) {
    signStr += `${key}=${params[key]}&`;
  }

  // Step 5: Append API key (key=API_KEY, no trailing &)
  signStr += `key=${apiKey}`;

  // Step 6: MD5 hash
  return createHash('md5').update(signStr).digest('hex');
}

export async function handler(event) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { playerId, packageId, amount, price, name, email, phone } = JSON.parse(event.body || '{}');

    if (!playerId || !packageId || !price) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Build the callback URL (do NOT URL encode it per WatchPays docs)
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://cardinguc.com';
    const callbackUrl = siteUrl;

    // Generate a unique order number
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const merchantOrderNo = `ORD${Date.now()}${randomSuffix}`;

    // Amount must always have 2 decimals per WatchPays docs
    const formattedAmount = parseFloat(price).toFixed(2);

    // Generate MD5 signature using ONLY the 4 required params
    const signature = generateSignature(
      GATEWAY_CONFIG.merchantId,
      formattedAmount,
      merchantOrderNo,
      callbackUrl,
      GATEWAY_CONFIG.apiKey
    );

    // Build the full JSON request body matching the Example Request from docs
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
    console.log(`[create-payment] Request body:`, JSON.stringify(requestBody));

    // Call the WatchPays API with JSON body
    const response = await fetch(GATEWAY_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log(`[create-payment] WatchPays response:`, JSON.stringify(data));

    // Handle success response per docs: { success: true, payment_url: "..." }
    if (data.success === true && data.payment_url) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paymentUrl: data.payment_url,
          method: 'redirect',
        }),
      };
    } else {
      console.error(`[create-payment] WatchPays error:`, data.message || JSON.stringify(data));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: data.message || 'Payment gateway temporarily unavailable. Please try again.',
        }),
      };
    }
  } catch (error) {
    console.error('[create-payment] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create payment order. Please try again.' }),
    };
  }
}
