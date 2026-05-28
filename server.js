require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET','POST','OPTIONS'] }));
app.use(express.json());

app.use('/api/jobs',   require('./routes/jobs'));
app.use('/api/gmail',  require('./routes/gmail'));
app.use('/auth/gmail', require('./routes/gmail'));

app.get('/', (_, res) => res.json({
  app:    'ABRJobsApplier Backend',
  status: '✅ Running',
  port:   PORT,
  routes: {
    jobs:  '/api/jobs/search?q=ml+engineer&location=India',
    gmail: '/auth/gmail/login',
  }
}));

cron.schedule('0 */2 * * *', async () => {
  try   { await require('./routes/jobs').refreshCache(); }
  catch (e) { console.error('[CRON]', e.message); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ABRJobsApplier running on port ${PORT}`);
});
