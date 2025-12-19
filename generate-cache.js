const fs = require('fs');
const https = require('https');

const ids = [
  "2908681", "2895564", "2874953", "2848263", "2831272", 
  "2797164", "2722124", "2696557", "2720822", "1805025", 
  "1805263", "1861559", "2149709", "2661418"
];

const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status Code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
};

async function generateCache() {
  console.log("Fetching data from INSPIRE-HEP...");
  const papers = [];
  const batchSize = 5;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    console.log(`Fetching batch ${i/batchSize + 1}...`);
    
    const batchPromises = batchIds.map(id => 
      fetchUrl(`https://inspirehep.net/api/literature/${id}`)
        .then(data => data)
        .catch(err => {
          console.error(`Error fetching ${id}:`, err.message);
          return null;
        })
    );

    const batchResults = await Promise.all(batchPromises);
    papers.push(...batchResults.filter(p => p !== null));

    // Wait a bit to respect rate limits
    if (i + batchSize < ids.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Sort by date descending (mimic frontend logic)
  papers.sort((a, b) => {
      const getPaperDate = (paper) => {
          const metadata = paper.metadata;
          if (metadata.publication_info && metadata.publication_info.length > 0 && metadata.publication_info[0].year) {
              return metadata.publication_info[0].year.toString();
          }
          if (metadata.preprint_date) return metadata.preprint_date;
          if (metadata.earliest_date) return metadata.earliest_date;
          return "0000";
      };
      const dateA = getPaperDate(a);
      const dateB = getPaperDate(b);
      return dateB.localeCompare(dateA);
  });

  fs.writeFileSync('publications.json', JSON.stringify(papers, null, 2));
  console.log(`Successfully wrote ${papers.length} papers to publications.json`);
}

generateCache();
