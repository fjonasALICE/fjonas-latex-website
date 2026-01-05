async function loadCV() {
  try {
    const response = await fetch('cv.yml');
    if (!response.ok) throw new Error("Could not fetch cv.yml");
    const text = await response.text();
    const data = jsyaml.load(text);
    renderCV(data);
  } catch (error) {
    console.error("Error loading CV:", error);
    const container = document.getElementById('cv-content');
    if (container) {
      container.innerHTML = `<p>Error loading CV: ${error.message}</p>`;
    }
  }
}

function renderCV(sections) {
  const container = document.getElementById('cv-content');
  if (!container) return;
  container.innerHTML = '';

  sections.forEach(section => {
    // Skip General Information
    if (section.title === 'General Information') return;

    // Determine renderer
    if (section.type && typeRenderers[section.type]) {
      // For time_table, we pass the title as caption and do NOT create an h3
      if (section.type === 'time_table') {
        const element = typeRenderers[section.type](section.contents, section.title);
        if (element) container.appendChild(element);
      } else {
        // For other types, keep the heading
        if (section.title) {
          const h3 = document.createElement('h3');
          h3.textContent = section.title;
          container.appendChild(h3);
        }
        const element = typeRenderers[section.type](section.contents);
        if (element) container.appendChild(element);
      }
    }
  });
}

const typeRenderers = {
  map: renderMap,
  time_table: renderTimeTable,
  nested_list: renderNestedList,
  list: renderList
};

function renderMap(contents) {
  const table = document.createElement('table');
  table.classList.add('borders-custom');
  const tbody = document.createElement('tbody');
  
  contents.forEach(item => {
    const tr = document.createElement('tr');
    
    const tdName = document.createElement('td');
    tdName.innerHTML = `<strong>${item.name}</strong>`;
    tdName.style.paddingRight = '2rem';
    
    const tdValue = document.createElement('td');
    tdValue.textContent = item.value;
    
    tr.appendChild(tdName);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  return table;
}

function renderTimeTable(contents, title) {
  const table = document.createElement('table');
  table.style.marginBottom = '2rem';
  
  if (title) {
    const caption = document.createElement('caption');
    caption.textContent = title;
    table.appendChild(caption);
  }

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  
  const thYear = document.createElement('th');
  thYear.textContent = 'Year';
  thYear.scope = 'col';
  thYear.style.width = '15%'; // Moved width from td to th
  
  const thContent = document.createElement('th');
  thContent.textContent = 'Description';
  thContent.scope = 'col';
  
  trHead.appendChild(thYear);
  trHead.appendChild(thContent);
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  
  contents.forEach(item => {
    const tr = document.createElement('tr');
    
    // Year column
    const tdYear = document.createElement('td');
    tdYear.style.verticalAlign = 'top';
    // Width handled by th
    tdYear.textContent = item.year;
    
    // Content column
    const tdContent = document.createElement('td');
    
    if (item.items) {
      // Case for Honors and Awards (list of items)
      const ul = document.createElement('ul');
      ul.style.margin = '0';
      ul.style.paddingLeft = '1.2em';
      item.items.forEach(i => {
        const li = document.createElement('li');
        li.textContent = i;
        ul.appendChild(li);
      });
      tdContent.appendChild(ul);
    } else {
      // Case for Education/Experience
      let contentHtml = '';
      if (item.title) contentHtml += `<strong>${item.title}</strong>`;
      if (item.institution) contentHtml += `<br>${item.institution}`;
      if (item.department) contentHtml += `<br>${item.department}`;
      if (item.location) contentHtml += `, ${item.location}`;
      
      if (item.maindescription) {
        contentHtml += `<br><em>${item.maindescription.join(' ')}</em>`;
      }
      if (item.description) {
        contentHtml += `<br><small>${item.description.join(' ')}</small>`;
      }
      tdContent.innerHTML = contentHtml;
    }
    
    tr.appendChild(tdYear);
    tr.appendChild(tdContent);
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  return table;
}

function renderNestedList(contents) {
  const div = document.createElement('div');
  contents.forEach(group => {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${group.title}</strong>`;
    div.appendChild(p);
    
    if (group.items && group.items.length > 0) {
      const ul = document.createElement('ul');
      group.items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
  });
  return div;
}

function renderList(contents) {
  const ul = document.createElement('ul');
  contents.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = item;
    ul.appendChild(li);
  });
  return ul;
}

document.addEventListener('DOMContentLoaded', () => {
  // Ensure jsyaml is loaded
  let attempts = 0;
  const checkLib = () => {
    if (typeof jsyaml !== 'undefined') {
        loadCV();
    } else {
        attempts++;
        if (attempts > 50) { // 5 seconds timeout
            const container = document.getElementById('cv-content');
            if (container) container.innerHTML = '<p>Error: js-yaml library could not be loaded.</p>';
            return;
        }
        setTimeout(checkLib, 100);
    }
  };
  checkLib();
});


