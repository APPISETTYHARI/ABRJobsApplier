const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

function oAuth2() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/auth/gmail/callback'
  );
}

let tokens = process.env.GMAIL_REFRESH_TOKEN ? { refresh_token: process.env.GMAIL_REFRESH_TOKEN } : null;
let emailCache = [], lastScan = null;

const TAGS = {
  INTERVIEW: ['interview','shortlisted','selected for','schedule a call','technical round','hr round','assessment','coding round','next round'],
  OFFER:     ['offer letter','pleased to offer','congratulations','job offer'],
  REJECTED:  ['regret','not moving forward','not selected','unfortunately','other candidates'],
  APPLIED:   ['received your application','application received','thank you for applying'],
  'FOLLOW-UP':['follow up','next steps','update on your application','status of your'],
};

function classify(subject, snippet) {
  const t = `${subject} ${snippet}`.toLowerCase();
  for (const [tag, kws] of Object.entries(TAGS)) if (kws.some(k=>t.includes(k))) return tag;
  return 'OTHER';
}

function isJobEmail(from, subject) {
  const t = `${from} ${subject}`.toLowerCase();
  return ['careers','recruiting','hr@','talent','jobs@','naukri','linkedin','indeed','glassdoor',
    'instahyre','internshala','cutshort','infosys','tcs','wipro','hcl','accenture','capgemini',
    'techm','cognizant','ibm','amazon','google','microsoft','zoho','freshworks','samsung'].some(k=>t.includes(k));
}

function fmtDate(d) {
  const now = new Date(), diff = (now-d)/1000;
  if (diff<86400 && d.toDateString()===now.toDateString()) return 'Today '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  if (diff<172800) return 'Yesterday '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+', '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}

async function fetchEmails(auth) {
  const gmail = google.gmail({ version:'v1', auth });
  const list = await gmail.users.messages.list({
    userId:'me',
    q:'from:(careers OR recruiting OR hr OR naukri OR linkedin OR indeed OR talent OR jobs) newer_than:30d',
    maxResults:30,
  });
  const msgs = list.data.messages || [];
  const emails = [];
  for (const m of msgs.slice(0,20)) {
    try {
      const d = await gmail.users.messages.get({ userId:'me', id:m.id, format:'metadata', metadataHeaders:['From','Subject','Date'] });
      const hdr = d.data.payload.headers || [];
      const from    = hdr.find(h=>h.name==='From')?.value||'';
      const subject = hdr.find(h=>h.name==='Subject')?.value||'(No subject)';
      const date    = hdr.find(h=>h.name==='Date')?.value||'';
      const snippet = d.data.snippet||'';
      const read    = !d.data.labelIds?.includes('UNREAD');
      if (!isJobEmail(from, subject)) continue;
      const tag = classify(subject, snippet);
      if (tag==='OTHER') continue;
      emails.push({ id:m.id, from:from.replace(/<.*?>/,'').trim(), subject, time:fmtDate(new Date(date)), tag, read, _date:new Date(date).toISOString() });
    } catch {}
  }
  emails.sort((a,b)=>new Date(b._date)-new Date(a._date));
  return emails;
}

// GET /auth/gmail/login
router.get('/login', (req, res) => {
  if (!process.env.GMAIL_CLIENT_ID || process.env.GMAIL_CLIENT_ID==='your_client_id') {
    return res.send('<h2 style="font-family:monospace">Gmail not configured — add GMAIL_CLIENT_ID to .env</h2>');
  }
  const url = oAuth2().generateAuthUrl({ access_type:'offline', prompt:'consent', scope:['https://www.googleapis.com/auth/gmail.readonly'] });
  res.redirect(url);
});

// GET /auth/gmail/callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error||!code) return res.status(400).send('OAuth error: '+error);
  try {
    const auth = oAuth2();
    const { tokens: t } = await auth.getToken(code);
    tokens = t;
    auth.setCredentials(t);
    emailCache = await fetchEmails(auth);
    lastScan = new Date().toISOString();
    const interviews = emailCache.filter(e=>e.tag==='INTERVIEW').length;
    res.send(`<html><body style="font-family:monospace;background:#050508;color:#c4c4d8;padding:40px">
      <h2 style="color:#22c55e">✅ Gmail Connected!</h2>
      <p>Found <b style="color:#22c55e">${emailCache.length}</b> job emails · <b style="color:#f5a623">${interviews}</b> interviews detected</p>
      <p style="color:#ef4444;margin-top:20px">⚠️ Add this to Railway environment variables:</p>
      <code style="background:#0c0c14;display:block;padding:14px;border-radius:8px;color:#06b6d4;word-break:break-all;margin-top:8px">GMAIL_REFRESH_TOKEN=${t.refresh_token||'(see console)'}</code>
      </body></html>`);
  } catch(e) {
    res.status(500).send('Error: '+e.message);
  }
});

router.get('/emails', async (req, res) => {
  if (!tokens?.refresh_token) {
    return res.json({ success:false, connected:false, emails: mockEmails() });
  }
  try {
    if (emailCache.length && lastScan && (Date.now()-new Date(lastScan))/60000 < 25) {
      return res.json({ success:true, connected:true, emails:emailCache, lastScan });
    }
    const auth = oAuth2();
    auth.setCredentials(tokens);
    emailCache = await fetchEmails(auth);
    lastScan = new Date().toISOString();
    res.json({ success:true, connected:true, emails:emailCache, lastScan });
  } catch(e) {
    res.status(500).json({ success:false, error:e.message, emails:mockEmails() });
  }
});

router.get('/status', (_, res) => res.json({
  connected: !!tokens?.refresh_token,
  lastScan, emailCount: emailCache.length,
  interviews: emailCache.filter(e=>e.tag==='INTERVIEW').length,
}));

function mockEmails() {
  return [
    {id:'m1',from:'careers@tcs.com',subject:'Interview Invitation – TCS NQT Technical Round',time:'Today 10:23 AM',tag:'INTERVIEW',read:false},
    {id:'m2',from:'hr@infosys.com',subject:'Application Received – ML Engineer',time:'Yesterday 3:41 PM',tag:'APPLIED',read:true},
    {id:'m3',from:'talent@wipro.com',subject:'Thank you for applying – AI Engineer',time:'Mar 23, 9:00 AM',tag:'APPLIED',read:true},
    {id:'m4',from:'recruit@accenture.com',subject:'Next Steps – Your Application',time:'Mar 22, 2:15 PM',tag:'FOLLOW-UP',read:false},
  ];
}

module.exports = router;
module.exports.checkEmails = async function() {
  if (!tokens?.refresh_token) return;
  const auth = oAuth2(); auth.setCredentials(tokens);
  emailCache = await fetchEmails(auth); lastScan = new Date().toISOString();
};
