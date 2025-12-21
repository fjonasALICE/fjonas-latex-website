// Function to fetch and process publications from papers.md via INSPIRE-HEP API
async function loadPublications() {
  const list = document.getElementById('paper-list');
  
  try {
    // 1. Fetch papers.md to get the list of IDs
    const response = await fetch('papers.md');
    if (!response.ok) throw new Error("Could not fetch papers.md");
    const text = await response.text();

    // 2. Extract INSPIRE IDs
    const lines = text.split('\n');
    const ids = [];
    const regex = /inspirehep\.net\/literature\/(\d+)/;
    
    for (const line of lines) {
      const match = line.match(regex);
      if (match && match[1]) {
        ids.push(match[1]);
      }
    }

    if (ids.length === 0) {
      list.innerHTML = '<li>No publications found in papers.md</li>';
      return;
    }

    // 3. Construct the single search query
    // Query format: control_number:123 OR control_number:456 ...
    const query = ids.map(id => `control_number:${id}`).join(' OR ');
    
    // Fields to retrieve (minimized for bandwidth)
    // We include 'abstracts' as requested.
    const fields = [
      'titles',
      'authors',
      'publication_info',
      'preprint_date',
      'earliest_date',
      'arxiv_eprints',
      'dois',
      'citation_count',
      'collaborations',
      'abstracts',
      'documents',
      'control_number'
    ].join(',');

    // 4. Fetch from INSPIRE-HEP API
    // We use the search endpoint
    const searchUrl = `https://inspirehep.net/api/literature?q=${encodeURIComponent(query)}&fields=${fields}&size=100`;
    
    console.log("Fetching publications from INSPIRE-HEP...");
    const apiResponse = await fetch(searchUrl);
    
    if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.statusText}`);
    }
    
    const data = await apiResponse.json();
    const papers = data.hits.hits; // Search results are in hits.hits

    // 5. Sort by date (descending)
    papers.sort((a, b) => {
      const dateA = getPaperDate(a);
      const dateB = getPaperDate(b);
      return dateB.localeCompare(dateA);
    });

    // 6. Render
    renderPapersFromAPI(papers);

    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }

  } catch (error) {
    console.error("Error loading publications:", error);
    if (list.children.length === 0 || list.innerHTML.includes('Loading')) {
        list.innerHTML = `<li>Error loading publications: ${error.message}</li>`;
    }
  }
}

function getPaperDate(paper) {
  // Try publication date, then preprint date, then earliest date
  const metadata = paper.metadata;
  if (metadata.publication_info && metadata.publication_info.length > 0 && metadata.publication_info[0].year) {
      // Create a sortable string YYYY
      return metadata.publication_info[0].year.toString();
  }
  if (metadata.preprint_date) return metadata.preprint_date;
  if (metadata.earliest_date) return metadata.earliest_date;
  return "0000";
}

function renderPapersFromAPI(papers) {
  const list = document.getElementById('paper-list');
  list.innerHTML = '';

  papers.forEach(paper => {
    const meta = paper.metadata;
    const li = document.createElement('li');

    // Title
    const title = meta.titles && meta.titles.length > 0 ? meta.titles[0].title : "Untitled";

    // Authors
    let authorsHtml = formatAuthors(meta);

    // Venue / Journal
    let venue = "Preprint";
    if (meta.publication_info && meta.publication_info.length > 0) {
      const pub = meta.publication_info[0];
      if (pub.journal_title) {
        venue = `${pub.journal_title}`;
        if (pub.journal_volume) venue += ` <strong>${pub.journal_volume}</strong>`;
        if (pub.year) venue += ` (${pub.year})`;
        if (pub.page_start) venue += `, ${pub.page_start}`;
        else if (pub.artid) venue += `, ${pub.artid}`;
      }
    } else if (meta.preprint_date) {
        venue = `Preprint (${meta.preprint_date.substring(0, 4)})`;
    } else if (meta.earliest_date) {
        venue = `(${meta.earliest_date.substring(0, 4)})`;
    }
    
    // Links
    const links = [];

    // Abstract
    if (meta.abstracts && meta.abstracts.length > 0) {
      const abstractId = `abstract-${paper.id}`;
      // Move abstract to start of the item by prepending it to the li innerHTML later
      // But we can't easily prepend it outside the paragraph flow if we want it to align with title.
      // Sidenotes in latex.css are usually placed *before* the text they sidenote to align with top.
      // However, we are inside a list item.
      
      // We will construct the HTML such that the sidenote span is placed at the beginning of the <p> 
      // or at least before the content that pushes height down.
      
      // Current structure:
      // li -> p -> strong(Title) ...
      
      // If we put the sidenote span right at the start of <p>, it should align with the first line (Title).
      
      const abstractContent = `<strong>Abstract:</strong> ${meta.abstracts[0].value} <label for="${abstractId}" class="abstract-close">[Close]</label>`;
      const abstractToggle = `<label for="${abstractId}" class="sidenote-toggle abstract-toggle">[Abstract]</label><input type="checkbox" id="${abstractId}" class="sidenote-toggle" /><span class="sidenote abstract-content">${abstractContent}</span>`;
      
      // We'll return the toggle button as part of links, but we need to inject the sidenote span earlier.
      // Let's refactor how we build the HTML.
      
      // Actually, to make the sidenote appear at the height of the title, it must be placed *before* the title in the DOM.
      // So we will add the sidenote span + checkbox at the start of the paragraph.
      // The toggle label (button) can remain at the bottom with other links.
      
      links.push(`<label for="${abstractId}" class="sidenote-toggle abstract-toggle">[Abstract]</label>`);
      
      // Store the hidden parts to prepend later
      var hiddenAbstractParts = `<input type="checkbox" id="${abstractId}" class="sidenote-toggle abstract-checkbox" /><span class="sidenote abstract-content">${abstractContent}</span><label for="${abstractId}" class="sidenote-backdrop"></label>`;
    } else {
       var hiddenAbstractParts = "";
    }

    if (meta.arxiv_eprints && meta.arxiv_eprints.length > 0) {
      const arxivId = meta.arxiv_eprints[0].value;
      links.push(`<a href="https://arxiv.org/abs/${arxivId}">[arXiv:${arxivId}]</a>`);
    }
    if (meta.dois && meta.dois.length > 0) {
      links.push(`<a href="https://doi.org/${meta.dois[0].value}">[DOI]</a>`);
    }
    // INSPIRE link
    if (paper.id) {
        links.push(`<a href="https://inspirehep.net/literature/${paper.id}">[INSPIRE]</a>`);
    }
    // PDF (if available in documents)
    if (meta.documents && meta.documents.length > 0) {
       // Find a fulltext
       const doc = meta.documents.find(d => d.fulltext) || meta.documents[0];
       links.push(`<a href="${doc.url}">[PDF]</a>`);
    }
    // Citation count
    if (meta.citation_count != null) {
        links.push(`<span class="citation-count" title="Citations">(${meta.citation_count} citations)</span>`);
    }

    li.innerHTML = `
      <p>
        ${hiddenAbstractParts}
        <strong>${title}</strong><br>
        ${authorsHtml}<br>
        <em>${venue}</em>
        <br>
        ${links.join(' ')}
      </p>
    `;
    list.appendChild(li);
  });
}

function formatAuthors(meta) {
    const authors = meta.authors || [];
    let authorList = [];
    
    // Check for collaboration
    let collaboration = null;
    if (meta.collaborations && meta.collaborations.length > 0) {
        collaboration = meta.collaborations[0].value;
    }

    // Try to find "Jonas" or "Florian" to highlight
    // We will normalize names to check.
    const myNamePatterns = ["Jonas, Florian", "Jonas, F.", "Florian Jonas"];
    
    // Helper to check if author matches me
    const isMe = (name) => {
        return myNamePatterns.some(p => name.includes("Jonas") && (name.includes("Florian") || name.includes("F.")));
    };

    // If authors list is very long (e.g. > 10) and collaboration exists
    if (collaboration && authors.length > 10) {
        // Check if I am in the first few
        let meFound = false;
        const firstFew = authors.slice(0, 3).map(a => a.full_name);
        
        // Format first few
        const formatted = firstFew.map(name => {
            if (isMe(name)) { meFound = true; return "<u>" + formatName(name) + "</u>"; }
            return formatName(name);
        });

        let result = formatted.join(", ") + " <em>et al.</em>";
        
        // If I am not in first few but in the list, append me? 
        // Or just rely on Collaboration name. 
        // Usually for ALICE papers, it's "ALICE Collaboration". 
        // But if I want to show my contribution, maybe I just list "ALICE Collaboration".
        // The user's previous preference was "Author et al." for ALICE papers in the bib file.
        
        return `${result} (${collaboration} Collaboration)`;
    } 
    
    // If not massive list or no collaboration
    // Format all authors (up to some limit, say 20?)
    // If > 20, truncate.
    const limit = 20;
    const displayAuthors = authors.slice(0, limit);
    
    const formattedAuthors = displayAuthors.map(a => {
        let name = a.full_name; // "Last, First"
        if (isMe(name)) {
            return "<u>" + formatName(name) + "</u>";
        }
        return formatName(name);
    });

    let text = formattedAuthors.join(", ");
    if (authors.length > limit) {
        text += " <em>et al.</em>";
    }
    
    if (collaboration) {
        text += ` (${collaboration} Collaboration)`;
    }

    return text;
}

function formatName(lastFirst) {
    // Convert "Jonas, Florian" to "F. Jonas" or keep "Florian Jonas" as requested?
    // User's previous code did: authors.replace("Florian Jonas", "<u>Florian Jonas</u>")
    // Bibtex usually stores as "Last, First".
    // Let's try to convert "Last, First" to "F. Last" or "First Last".
    // API returns "Last, First".
    const parts = lastFirst.split(',');
    if (parts.length === 2) {
        const last = parts[0].trim();
        const first = parts[1].trim();
        // Convert to "F. Last"
        const initial = first.charAt(0) + ".";
        return `${initial} ${last}`;
    }
    return lastFirst;
}

// ---- Legacy Talk Loader ----

async function loadTalks() {
    try {
        // Add cache-busting parameter to ensure we get the latest version
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`talk.bib${cacheBuster}`, {
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error("Could not fetch talk.bib");
        const text = await response.text();
        console.log('Loaded talk.bib, length:', text.length);
        const talks = parseBibTeX(text);
        console.log('Parsed talks:', talks.length, 'entries');
        console.log('Talk keys:', talks.map(t => t.key));
        renderTalks(talks);
    } catch (e) {
        console.error('Error loading talks:', e);
        document.getElementById('talk-list').innerHTML = "<li>Error loading talks.</li>";
    }
}

// Re-use parseBibTeX and renderTalks from previous file...
// I will keep them but remove renderPapers/loadBibTeX

function parseBibTeX(text) {
  const entries = [];
  const entryRegex = /@(\w+)\s*{\s*([^,]+),([^@]+)/g;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    const type = match[1];
    const key = match[2].trim();
    const body = match[3];
    const entry = { type, key };
    const fieldRegex = /(\w+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|(\d+))/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      let value = fieldMatch[2] || fieldMatch[3] || fieldMatch[4];
      if (value) {
        value = value.replace(/\s+/g, ' ').trim();
        // Convert year to number for proper sorting
        if (fieldName === 'year') {
          entry[fieldName] = parseInt(value, 10) || 0;
        } else {
          entry[fieldName] = value;
        }
      }
    }
    entries.push(entry);
  }
  return entries;
}

function renderTalks(talks) {
  const list = document.getElementById('talk-list');
  list.innerHTML = '';
  talks.sort((a, b) => (b.year || 0) - (a.year || 0));
  talks.forEach(talk => {
    const li = document.createElement('li');
    let links = [];
    if (talk.indico) links.push(`<a href="${talk.indico}">[Slides]</a>`);
    if (talk.url) links.push(`<a href="${talk.url}">[URL]</a>`);
    const event = talk.note || "Event";

    let tagColor = "";
    if (talk.abbr) {
        const t = talk.abbr.toLowerCase().trim();
        if (t === 'talk' || t === 'talk & poster') tagColor = "#f08080";
        else if (t === 'poster') tagColor = "#6495ed";
        else if (t === 'plenary talk' || t.includes('multi-exp')) tagColor = "#daa520";
    }
    
    const styleAttr = tagColor 
        ? ` style="color: ${tagColor}; font-size: 0.8em; font-weight: bold; margin-left: 0.5em; vertical-align: 1px;"` 
        : ` style="font-size: 0.8em; font-weight: bold; margin-left: 0.5em; vertical-align: 1px;"`;
    const typeLabel = talk.abbr ? `<span${styleAttr}>[${talk.abbr}]</span>` : "";

    li.innerHTML = `
      <p>
        <strong>${talk.title.replace(/[{}]/g, '')}</strong> ${typeLabel}<br>
        ${event}<br>
        ${talk.month ? talk.month + ' ' : ''}${talk.year}.
        ${links.length > 0 ? '<br>' + links.join(' ') : ''}
      </p>
    `;
    list.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPublications();
    loadTalks();

    // Event delegation for exclusive abstract toggling
    const paperList = document.getElementById('paper-list');
    if (paperList) {
        paperList.addEventListener('change', (e) => {
            if (e.target.classList.contains('abstract-checkbox') && e.target.checked) {
                const allCheckboxes = paperList.querySelectorAll('.abstract-checkbox');
                allCheckboxes.forEach(cb => {
                    if (cb !== e.target) {
                        cb.checked = false;
                    }
                });
            }
        });
    }
});
