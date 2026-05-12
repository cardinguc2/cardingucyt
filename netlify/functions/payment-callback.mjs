import crypto from 'crypto';

const GATEWAY_SECRET = process.env.PAYMENT_SECRET || 'e29816ea4c985fe2aae6e0e323b90954';

/**
 * Verify callback signature from payment gateway.
 */
function verifySign(params, secret) {
  const receivedSign = params.sign;
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== '' && params[k] != null)
    .sort();

  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${secret}`;
  const expectedSign = crypto.createHash('md5').update(signStr).digest('hex');

  return receivedSign === expectedSign;
}

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Accept both POST and GET callbacks
  let params;
  if (event.httpMethod === 'POST') {
    try {
      // Try JSON first, then form-encoded
      const contentType = event.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        params = JSON.parse(event.body || '{}');
      } else {
        params = Object.fromEntries(new URLSearchParams(event.body || ''));
      }
    } catch {
      params = Object.fromEntries(new URLSearchParams(event.body || ''));
    }
  } else if (event.httpMethod === 'GET') {
    params = event.queryStringParameters || {};
  } else {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  console.log(`[payment-callback] Received callback:`, JSON.stringify(params));

  try {
    // Verify signature
    if (params.sign) {
      const isValid = verifySign(params, GATEWAY_SECRET);
      if (!isValid) {
        console.error('[payment-callback] Invalid signature!');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ status: 'error', message: 'Invalid signature' }),
        };
      }
    }

    // Extract order details
    const merchantOrderId = params.merchant_order_id || params.out_trade_no || params.orderId || '';
    const status = params.status || params.trade_status || params.order_status || '';
    const amount = params.amount || params.total_amount || '';
    const gatewayOrderId = params.order_id || params.trade_no || params.transaction_id || '';

    console.log(`[payment-callback] Order: ${merchantOrderId}, Status: ${status}, Amount: ${amount}, Gateway ID: ${gatewayOrderId}`);

    // Process the payment result
    if (status === 'success' || status === 'paid' || status === 'TRADE_SUCCESS' || status === '1' || status === 'completed') {
      console.log(`[payment-callback] Payment SUCCESS for order: ${merchantOrderId}`);
      // In a production app, you would:
      // 1. Update your database with the payment status
      // 2. Trigger UC delivery to the player
      // 3. Send confirmation notification
    } else {
      console.log(`[payment-callback] Payment status ${status} for order: ${merchantOrderId}`);
    }

    // Respond with success to acknowledge receipt
    // Most payment gateways expect "success" or "ok" as the response body
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: 'success',
    };
  } catch (error) {
    console.error('[payment-callback] Error processing callback:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Callback processing failed' }),
    };
  }
}
