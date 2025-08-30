// Netlify Function (Node 16+) sample to accept newsletter subscriptions.
// Deploy this under netlify/functions/subscribe (Netlify automatically maps the path).
// In production, validate input and forward to your provider (Mailchimp, SendGrid, etc.).

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const data = JSON.parse(event.body || '{}');
    const email = (data.email || '').trim();
    if (!email || !email.includes('@')) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };

    // TODO: Forward email to your provider using API key from env vars (DO NOT store keys in repo).
    // Example: process.env.MAILCHIMP_API_KEY, process.env.MAILCHIMP_LIST_ID

    // For demo, just return success and echo back (you should store/forward instead)
    return { statusCode: 200, body: JSON.stringify({ ok: true, email }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
