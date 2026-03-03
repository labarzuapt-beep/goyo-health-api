export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lng, radius = 15000, type = 'assisted_living' } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let keyword, placeType;
  
  switch(type) {
    case 'assisted_living':
      keyword = 'assisted living OR senior living OR independent living OR retirement community';
      placeType = 'health';
      break;
    case 'doctors':
      keyword = 'doctor OR physician OR medical clinic OR family medicine';
      placeType = 'doctor';
      break;
    case 'hospitals':
      keyword = 'hospital OR medical center OR emergency room';
      placeType = 'hospital';
      break;
    case 'pharmacy':
      keyword = 'pharmacy OR drugstore';
      placeType = 'pharmacy';
      break;
    case 'physical_therapy':
      keyword = 'physical therapy OR physiotherapy OR rehabilitation';
      placeType = 'physiotherapist';
      break;
    case 'home_health':
      keyword = 'home health care OR home care services OR nursing care';
      placeType = 'health';
      break;
    case 'memory_care':
      keyword = 'memory care OR dementia care OR alzheimers care';
      placeType = 'health';
      break;
    default:
      keyword = type;
      placeType = 'health';
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&type=${placeType}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ZERO_RESULTS' || (data.results && data.results.length === 0)) {
      console.log('No results, trying broader search...');
      const broaderUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius * 2}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      const broaderResponse = await fetch(broaderUrl);
      const broaderData = await broaderResponse.json();
      return res.status(200).json(broaderData);
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to fetch places data' });
  }
}
```

**After pasting this into `places.js` on GitHub, do these 3 things:**

1. **Delete** the old `api/index.js` file from GitHub
2. **Add the environment variable** in Vercel:
   - Vercel Dashboard → your project → **Settings** → **Environment Variables**
   - Name: `GOOGLE_PLACES_API_KEY`
   - Value: your Google API key
   - Click Save
3. **Redeploy** — go to the **Deployments** tab in Vercel and click **Redeploy**

Then test it at:
```
https://goyo-health-api.vercel.app/api/places?lat=25.7617&lng=-80.1918&type=pharmacy
