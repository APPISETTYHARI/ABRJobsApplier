const express = require('express');
const axios = require('axios');
const router = express.Router();

// ── In-memory cache ────────────────────────────────────
let cache = [], cacheTime = null;

// ── Skill list for match scoring ───────────────────────
const SKILLS_VOCAB = [
  'python','java','javascript','sql','nosql','machine learning','deep learning',
  'tensorflow','pytorch','nlp','computer vision','data science','data analysis',
  'react','node','aws','azure','gcp','docker','kubernetes','git','rest api',
  'spark','hadoop','power bi','tableau','excel','scikit','pandas','numpy',
  'django','flask','fastapi','statistics','llm','transformer','langchain',
];

function scoreMatch(job, userSkills) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g,'');
  const desc = norm(`${job.title} ${job.description||''} ${(job.skills||[]).join(' ')}`);
  const uSkills = (userSkills||[]).map(norm);
  let hits = 0;
  uSkills.forEach(s => { if (desc.includes(s)) hits++; });
  return Math.min(98, 52 + Math.round((hits / Math.max(uSkills.length, 1)) * 46));
}

function normalize(raw, platform) {
  return {
    id: `${platform}-${raw.job_id || Math.random().toString(36).slice(2)}`,
    title: raw.job_title || raw.title || 'Role',
    company: (raw.employer_name || raw.company || 'Company').trim(),
    location: raw.job_city ? `${raw.job_city}, ${raw.job_country||'India'}` : (raw.location||'India'),
    platform,
    salary: raw.job_min_salary
      ? `₹${Math.round(raw.job_min_salary/100000)}–${Math.round((raw.job_max_salary||raw.job_min_salary*1.5)/100000)} LPA`
      : 'Not disclosed',
    posted: raw.job_posted_at_datetime_utc ? timeAgo(new Date(raw.job_posted_at_datetime_utc)) : 'Recently',
    skills: extractSkills(raw.job_description||raw.description||''),
    desc: (raw.job_description||raw.description||'').substring(0,600),
    reqs: [],
    easy: raw.job_apply_is_direct === true,
    url: raw.job_apply_link || `https://www.${platform}.com/jobs`,
    match: 70,
  };
}

function timeAgo(d) {
  const s = (Date.now()-d)/1000;
  if(s<3600) return `${Math.round(s/60)}m ago`;
  if(s<86400) return `${Math.round(s/3600)}h ago`;
  return `${Math.round(s/86400)}d ago`;
}

function extractSkills(text) {
  const known = ['Python','TensorFlow','PyTorch','SQL','NLP','ML','AI','Java','React','Node.js',
    'AWS','Docker','Kubernetes','Deep Learning','Scikit-learn','Pandas','Spark','Power BI',
    'Tableau','Excel','Git','REST API','Django','Flask','C++','R','Statistics','LLM'];
  const lower = text.toLowerCase();
  return known.filter(s => lower.includes(s.toLowerCase())).slice(0,6);
}

// ── JSearch API (covers LinkedIn, Indeed, Glassdoor, Naukri) ─
// Safe: licensed aggregator, no user account needed
async function fetchJSearch(query, location='India', userSkills=[]) {
  if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY==='your_key_here') {
    return getMockJobs(userSkills);
  }
  try {
    const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { query:`${query} in ${location}`, page:'1', num_pages:'3', date_posted:'week' },
      headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, 'X-RapidAPI-Host':'jsearch.p.rapidapi.com' },
      timeout: 14000,
    });
    return (res.data.data||[]).slice(0,20).map((j,i) => {
      const plat = j.job_apply_link?.includes('linkedin') ? 'linkedin'
                 : j.job_apply_link?.includes('indeed')   ? 'indeed'
                 : j.job_apply_link?.includes('glassdoor')? 'glassdoor' : 'linkedin';
      const norm = normalize(j, plat);
      norm.match = scoreMatch(norm, userSkills);
      return norm;
    });
  } catch(e) {
    console.error('[JSearch]', e.message);
    return getMockJobs(userSkills);
  }
}

// ── Mock fallback ──────────────────────────────────────
function getMockJobs(userSkills=[]) {
  const base = [
    {title:'Machine Learning Engineer',company:'Infosys',location:'Bengaluru, India',platform:'linkedin',salary:'₹8–12 LPA',skills:['Python','TensorFlow','MLOps'],easy:true,url:'https://linkedin.com/jobs',desc:'Join our AI team to build ML systems at scale.'},
    {title:'Data Scientist',company:'TCS',location:'Chennai, India',platform:'naukri',salary:'₹6–10 LPA',skills:['Python','ML','SQL'],easy:true,url:'https://naukri.com',desc:'Data Science role with focus on analytics products.'},
    {title:'AI Engineer',company:'Wipro',location:'Hyderabad, India',platform:'indeed',salary:'₹7–11 LPA',skills:['Deep Learning','PyTorch','NLP'],easy:true,url:'https://indeed.com',desc:'Build AI-powered intelligent systems.'},
    {title:'Software Engineer – AI',company:'HCL',location:'Noida, India',platform:'linkedin',salary:'₹5–9 LPA',skills:['Python','REST API','Git'],easy:false,url:'https://linkedin.com/jobs',desc:'AI/ML integration in enterprise software.'},
    {title:'Junior Data Analyst',company:'Capgemini',location:'Pune, India',platform:'naukri',salary:'₹4–7 LPA',skills:['Excel','SQL','Power BI'],easy:true,url:'https://naukri.com',desc:'Analytics role supporting business decisions.'},
    {title:'Python Developer',company:'Tech Mahindra',location:'Chennai, India',platform:'indeed',salary:'₹5–8 LPA',skills:['Python','Django','REST API'],easy:true,url:'https://indeed.com',desc:'Build scalable web applications.'},
    {title:'ML Research Intern',company:'Samsung R&D',location:'Bengaluru, India',platform:'linkedin',salary:'₹30K/month',skills:['PyTorch','Research','NLP'],easy:false,url:'https://linkedin.com/jobs',desc:'6-month paid research internship.'},
    {title:'Data Engineer',company:'Accenture',location:'Bengaluru, India',platform:'naukri',salary:'₹7–12 LPA',skills:['Spark','SQL','AWS'],easy:true,url:'https://naukri.com',desc:'Build and maintain large-scale data pipelines.'},
  ];
  const postings = ['2h ago','5h ago','1d ago','1d ago','2d ago','2d ago','3d ago','3d ago'];
  return base.map((j,i) => ({
    id: `mock-${i}`, ...j,
    posted: postings[i],
    reqs: [],
    match: scoreMatch(j, userSkills),
  }));
}

// ── Routes ─────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q='machine learning', location='India', skills='', minMatch='0' } = req.query;
    const userSkills = skills ? skills.split(',').map(s=>s.trim()) : [];

    // Serve cache if fresh
    if (cache.length && cacheTime && (Date.now()-cacheTime)/60000 < 90) {
      const filtered = cache.filter(j => j.match >= parseInt(minMatch));
      return res.json({ success:true, count:filtered.length, cached:true, jobs:filtered });
    }

    const jobs = await fetchJSearch(q, location, userSkills);
    jobs.sort((a,b) => b.match-a.match);
    cache = jobs.slice(0,40);
    cacheTime = Date.now();
    const filtered = cache.filter(j => j.match >= parseInt(minMatch));
    res.json({ success:true, count:filtered.length, jobs:filtered });
  } catch(e) {
    res.status(500).json({ success:false, error:e.message, jobs:getMockJobs() });
  }
});

router.get('/cached', (req,res) => res.json({ success:true, count:cache.length, jobs:cache }));

router.post('/apply', (req,res) => {
  const { jobId, title, company } = req.body;
  console.log(`[APPLY LOGGED] ${title} @ ${company} (${jobId})`);
  res.json({ success:true });
});

async function refreshCache() {
  const jobs = await fetchJSearch('software engineer machine learning data scientist', 'India', []);
  cache = jobs; cacheTime = Date.now();
}

module.exports = router;
module.exports.refreshCache = refreshCache;
