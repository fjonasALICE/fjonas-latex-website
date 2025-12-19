async function loadContact() {
  try {
    const response = await fetch('contactinfo.yaml');
    if (!response.ok) throw new Error("Could not fetch contactinfo.yaml");
    const text = await response.text();
    const data = jsyaml.load(text);
    renderContact(data);
  } catch (error) {
    console.error("Error loading Contact info:", error);
    const container = document.getElementById('contact-list');
    if (container) {
      container.innerHTML = `<p>Error loading contact info: ${error.message}</p>`;
    }
  }
}

function renderContact(data) {
  const container = document.getElementById('contact-list');
  if (!container) return;
  container.innerHTML = '';

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = '0';
  list.style.display = 'flex';
  list.style.flexWrap = 'wrap';
  list.style.gap = '1.5rem';
  list.style.marginTop = '1rem';

  // Mapping configuration
  // Using black icons to match LaTeX theme, handling dark mode via CSS invert
  const mappings = [
    { 
      key: 'email', 
      icon: 'gmail', // Using Gmail icon as generic envelope
      label: 'Email', 
      prefix: 'mailto:',
      valueFn: (val) => val 
    },
    { 
      key: 'linkedin_username', 
      icon: 'linkedin', 
      label: 'LinkedIn', 
      prefix: 'https://www.linkedin.com/in/',
      valueFn: (val) => val,
      // Fallback SVG for LinkedIn since simpleicons might not work
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em" class="contact-icon"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>'
    },
    { 
      key: 'github_username', 
      icon: 'github', 
      label: 'GitHub', 
      prefix: 'https://github.com/',
      valueFn: (val) => val 
    },
    { 
      key: 'orcid_id', 
      icon: 'orcid', 
      label: 'ORCID', 
      prefix: 'https://orcid.org/',
      valueFn: (val) => val 
    },
    { 
      key: 'scholar_userid', 
      icon: 'googlescholar', 
      label: 'Google Scholar', 
      prefix: 'https://scholar.google.com/citations?user=',
      valueFn: (val) => val 
    }
  ];

  mappings.forEach(map => {
    if (data[map.key]) {
      const li = document.createElement('li');
      
      const a = document.createElement('a');
      a.href = map.prefix + map.valueFn(data[map.key]);
      a.style.display = 'flex';
      a.style.alignItems = 'center';
      a.style.gap = '0.5rem';
      a.style.textDecoration = 'none';
      a.style.color = 'var(--body-color)'; // Use theme color
      
      // Icon
      let iconElement;
      if (map.svg) {
        // Use inline SVG if provided
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = map.svg;
        iconElement = tempDiv.firstChild;
        // Ensure class is added if not present in string
        if (!iconElement.classList.contains('contact-icon')) {
          iconElement.classList.add('contact-icon');
        }
      } else {
        // Use generic image
        iconElement = document.createElement('img');
        // Request black icon from Simple Icons CDN
        iconElement.src = `https://cdn.simpleicons.org/${map.icon}/000000`; 
        iconElement.alt = `${map.label} icon`;
        iconElement.style.width = '1.2em';
        iconElement.style.height = '1.2em';
        iconElement.classList.add('contact-icon');
      }
      
      a.appendChild(iconElement);
      
      // Text label
      const span = document.createElement('span');
      span.textContent = map.label;
      
      a.appendChild(span);
      li.appendChild(a);
      list.appendChild(li);
    }
  });
  
  container.appendChild(list);
  
  // Inject styles for dark mode
  // In dark mode, 'var(--body-color)' becomes light, so we need to invert the black icons to make them white
  const style = document.createElement('style');
  style.textContent = `
    .latex-dark .contact-icon {
      filter: invert(1);
    }
    @media (prefers-color-scheme: dark) {
      .latex-dark-auto .contact-icon {
        filter: invert(1);
      }
    }
    a:hover .contact-icon {
      opacity: 0.7;
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  // Check for jsyaml availability
  const checkLib = () => {
    if (typeof jsyaml !== 'undefined') {
        loadContact();
    } else {
        setTimeout(checkLib, 50);
    }
  };
  checkLib();
});
