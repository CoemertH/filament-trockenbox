const cards = document.querySelector('#cards');
const search = document.querySelector('#search');
const form = document.querySelector('#form');
const reset = document.querySelector('#reset');
const status = document.querySelector('#status');
const key = 'filament-trockenbox-rolls';
const dryingIntervalKey = 'filament-trocknungsintervalle';
const dryingActions = new WeakMap();
const labels = {durchmesser:'Durchmesser',gewicht:'Gewicht',druck:'Drucktemperatur',trocknung:'Trocknung'};
let rolls = [];
let editing = null;
try { const saved = JSON.parse(localStorage.getItem(key)); if (Array.isArray(saved)) rolls = saved; } catch {}
function element(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}

const materialFilter = document.querySelector('#material-filter');
const colorFilter = document.querySelector('#color-filter');
const overview = document.querySelector('#overview');
const availableOnly = document.querySelector('#available-only');
const back = document.querySelector('#all-rolls');
const pageNavigation = document.querySelector('#page-navigation');
const pageTitle = document.querySelector('header h1');
const homeIntro = document.querySelector('header p');
const pageTitles = {
  'filament-bestand':'Filamentbestand',
  'bestand-lagerort':'Bestand nach Lagerort',
  'filament-anlegen':'Filament erfassen',
  'filament-scannen':'Filament scannen',
  'meine-drucker':'Meine Drucker',
  'trocknung':'Trocknung',
  'datensicherung':'Datensicherung'
};
const qrCodes = {"support-pla-petg-schwarz":"/uaaI/wWnoMQbrZtdLt0mZn126sBAq7BOQXFB/qqqq/gB54pAJ/NEZy5qXUrrqnv9tWqONXxEPg5WrkwtDzQ3GKIXOPr8q2wM2xLenNbOo6QMag2n7REOsqXNJkX720afGySqZhQnk4U5S2utCA+12dZmgRkAZ2nPePAF6codWYNWWJxtf8AcK0UW/rd7yowWzIbE7qIob+d17Bo8W6Oi2MrBKLiLf/p6JjQgA==","petg-matt-gruen-03460604a":"/jdry/wRQqTQbrUvhrt11qWF264J0K7BdJV5B/qqqq/gE1GnAL4gKXPjbFwfCbzXApyOMWFPOhQthg/rlB5+xIBb1zNffzcNsLADGpB7q6LrXUuAs2S9V4tOPXqTstUv7g7eToQhPC6o922RQIfw6skgfrVl/D5JL/QCh49R4UhsuOUkN/4AQ26cY/hPEqrwWR2VG7qSkf+91rncNm68eSoPBB5eOR/vVD5rgA==","sunlu-pla-plus-weiss":"/qGYA/wUwoNQbr5NdLt0tJn126kxQq7BCAfFB/qqqq/gCj5tAJ/VFzy5jdU7zoCO9teLiBHzE/Urmqkw0FDS3GC4JOPz/Cgw92z6ynfSOqHQMYgfyrRGOhsTNJkUu40KfFZ1qZhSLZ4UbSUKNCR+RnNfngSIgZjHMsfAF6cKhWYdWSixtf6AWa8UW/qN5qowUXKbE7rYrR+d1xB58W6LiUMrBIbCIf/uyYiwgA==","sunlu-pla-plus-rot":"/twbA/wVNo9QbrUtVLt0U5v126kJQq7BK8XFB/qqqq/gCX5tAJ+2F7y8CdUnzobqdveLKI3yE/VsGrkwrPHS3GN4POPz4r9w92zC0HdSPEEwMYgVwrRGOotXNpkbsK0afFLkqZhTqlYUbSyb9CR+okFfngep8ZjHNcXAN6dAHWcdSaZRtf+AUK8UW/pl5qowULKbE7qCrR+d1ZB58W6PCUMrBArCIf/siYiwgA==","sunlu-petg-matt-orange":"/l9BQ/wQ7mDQbqjJort1eIWl26o9lK7BYKVZB/qqqq/gEC2nAL4Tg/Pk4JlKSY2VZLyv6KZ/OxawFw/rrGxe5IKLzqrXf5FB9HAiMDp+qS7eCGu41oKfVlL5DnqYvAQ/7kSdboQjH/84f2aSDMfwVvuE87QsiWtJKpLkhe8oCnhsibl1N/+Ac0ycY/kGiqrwUNERG7qcP/+91dwNNm62GyoPBLFMGR/oxC5rgA==","sunlu-petg-matt-blau":"/iZDQ/wSvmDQbrNport1UYWl26wV1K7BQedZB/qqqq/gGl3nAL5dhfPi7klKSYXKZLyv0sJ8OxPg9x/r7LNc5ICsLqrXcjRBNHCWnj7+qMIOCGuEwQK/VrqtD3qQOcQv7koGboQhn9cwf24IzMfw84mE87UHaXtJKM7khe96cnhsmXCVN/+AQUycY/hGiqrwUZERG7rWP/+91UwNNm6tGyoPBHVMGR/tpC5rgA==","sunlu-pla-plus-schwarz":"/mRBa/wQJmDQbqqpxrt1eoWF26490K7BU6ZJB/qqqq/gGG3jAL4Rg3Pk6ZlaCYnXZL6vq7Z9KxagFx/rrGxe5ICLRqLXb5EBsHA+2jr2qgOOGWu4koKdVhHpD3qavQQu7kS/bIQiH+8g/3eaTIfwnruE87WlmWtJItTkhe9LOntsibl1J/+Ac0ycY/kWiyrwUBEVG7qQP1+91RwINm60GwoPBLFMGR/oxD5rgA==","sunlu-pla-plus-klein-blau":"/hxpa/wRQqDQbrVPprt19qeF26oJkK7BRJVJB/qqqq/gH9GjAL5iKfPiZVwKCbjRAp6uUEFMKxY8hg/rlBx85IF7xzrXd7ON8HBLvpL2qIr7SWuEt2S9V8hePHqTo9U+7g7+ToQhPb6g/3QRgIfw+iEi87flPCtJJ/QChe8RwVtsuPUkN/4AYWycY/hfGyrwVR2VG7qQm9+91unINm68ewoPBA5MGR/vVD5rgA==","bambu-lab-pla-matt-grau":"/rayA/wTj4RQbq85XLt0YO6l26V8Zi7BUEcBB/qqqq/gAaVxAKNE8JkqbOU6m8rGtGeiuHMFL4i1y7kwuKvsraTqFE95vhZpInkjEEkbH+5ibPnGmlJkOtEsdUwOqZiZNTKk3M0GuZXdyb6qpFW5o3nxPwGFRR7beaW0XsJg+wBYPL1pkPyAXvz0R/scdyowRzlHErpeTp+N0MBspC6vy9FjBHw1HY/ueIi0gA==","sunlu-abs-hs-schwarz":"/iVDS/wStmTQbrVp5rt1c4WF26hVlK7BYORJB/qqqq/gEt2jAL51hXPj4hlLCYmsZJ6vkPJ9CxPx9w/r7LNcxIGNtqtXajTBNHCaWj7eqGJeCGuAgQKdVtqNDkqQKMQv7g4kbqQhvk8w/2cEjMfwJweEc7UH6XtJKI7kp+97cnlsmWCVN/+AYUycY/lGiyrwWdEVG7raP/+91RwINm6pGwoPBGVPOR/spC5rgA==","bambu-lab-pla-basic-beige":"/hZp6/wRiqDQbrVv5rt19KWF264JkK7BVJdJB/qqqq/gE9HjAL4kK/Pi4QwKCbDVApzOc2FNCxQthh/rlBx+5IF6XyLPZzuNsDCLNJL2qaMrSGuI1WSfV8peP2iTo9Uv7gr+ToQjDLa4f20RQMfwqkMiUrbh/CpJL5ACha9R8Vl8uvQkJv4AQWy8Y/nfEqrwVd3VG7rWk/+912nINm68eyoPBD5/OR/uVC5vgA==","bambu-lab-pla-matt-marineblau":"/sfFG/wQloNQbo3xZLt1SUCV26xoV67BZolxB/qqqq/gHb2SAIvuP4fJxPUth53GuF9B0fibF2Y3lsj3lIHw3GCsTLz3lIaRgfeyr44HbiUjO+WRothc2Iov63ThIEXo8jg3wLzDKi0uR4SVnPY3BuI+I3ZolAnHCYY6ZiBxYJ5gzb5V4fsAeeKEQ/uEnKoQQoGlHLrrj4/90kEruG6LwemBBDe7JW/sBPlzgA=="};
const colors = {Schwarz:'#131313',Weiß:'#fff',Rot:'#d23936',Grün:'#38a55a',Orange:'#f88733',Blau:'#355fe6','Klein-Blau':'#1729ab',Grau:'#9b9ea0',Beige:'#f7e6de',Marineblau:'#0078bf',Gelb:'#f4d542',Rosa:'#e884ae',Lila:'#8d58c8',Türkis:'#23a99e',Braun:'#87583e',Silber:'#b9c3cc',Gold:'#d6ad4a'};
const dryingByDevice = {
  'support-pla-petg-schwarz': ['Umluft-Trockenschrank · 75 °C · 8 Stunden'],
  'petg-matt-gruen-03460604a': ['SUNLU S4 oder E2 · 65 °C · mindestens 8 Stunden (Vergleichswert, Marke unbestätigt)'],
  'sunlu-petg-matt-orange': ['SUNLU S4 oder E2 · 65 °C · mindestens 8 Stunden'],
  'sunlu-petg-matt-blau': ['SUNLU S4 oder E2 · 65 °C · mindestens 8 Stunden'],
  'bambu-lab-pla-matt-grau': ['Umluft-Trockenschrank · 55 °C · 8 Stunden (EU-Shop)', 'Umluft-Trockenschrank · 50 °C · 8 Stunden (Datenblatt)'],
  'bambu-lab-pla-matt-marineblau': ['Umluft-Trockenschrank · 55 °C · 8 Stunden (EU-Shop)', 'Umluft-Trockenschrank · 50 °C · 8 Stunden (Datenblatt)'],
  'bambu-lab-pla-basic-beige': ['Umluft-Trockenschrank · 50 °C · 8 Stunden (Datenblatt und englischer EU-Shop)', 'AMS 2 Pro oder AMS HT · 55 °C · 8 Stunden', 'Umluft-Trockenschrank · 55 °C · 8 Stunden (französischer EU-Shop)'],
  'sunlu-abs-hs-schwarz': ['50 °C · Gerät und Dauer für ABS HS nicht angegeben']
};
const locationKey = 'filament-lagerorte';
function readLocations() {
  try {
    const saved = JSON.parse(localStorage.getItem(locationKey));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [];
}
function createLocationManager(onChange, feedback, initiallyOpen = false) {
  const manage = element('button','Lagerorte bearbeiten und hinzufügen');
  manage.type = 'button';
  const manager = element('div','');
  manager.className = 'location-manager';
  function changed(message) {
    for (const card of cards.children) card.dispatchEvent(new Event('locations-changed'));
    onChange(message);
  }
  function renderManager() {
    const places = readLocations();
    manager.replaceChildren(element('h3','Deine Lagerorte'));
    if (!places.length) manager.append(element('p','Du hast noch keine Lagerorte angelegt.'));
    for (const place of places) manager.append(locationForm(place));
    const create = element('button','Lagerort erstellen');
    create.type = 'button';
    const createRow = element('div','');
    createRow.className = 'location-create-row';
    createRow.append(create);
    create.onclick = () => {
      let editor = createRow.querySelector('form');
      if (!editor) {
        editor = locationForm(null);
        createRow.append(editor);
        create.setAttribute('aria-expanded','true');
      }
      editor.querySelector('input').focus();
    };
    create.setAttribute('aria-expanded','false');
    manager.append(createRow);
  }
  function affectedStocks(id) {
    const prefix = 'filament-bestand:';
    const affected = [];
    for (const key of Object.keys(localStorage).filter(key=>key.startsWith(prefix))) {
      const raw = localStorage.getItem(key);
      const stock = JSON.parse(raw);
      if (!Array.isArray(stock)) continue;
      const rows = stock.map((roll,index)=>({roll,index})).filter(({roll})=>roll?.locationId===id);
      if (rows.length) affected.push({key,raw,stock,rows});
    }
    return affected;
  }
  function removeLocationPanel(place, trigger) {
    const panel = element('div','');
    panel.className = 'location-remove';
    function preview() {
      panel.replaceChildren(element('strong','„'+place.name+'“ entfernen?'));
      let affected;
      try { affected = affectedStocks(place.id); }
      catch { panel.append(element('p','Die gespeicherten Zuordnungen konnten nicht geprüft werden.')); return; }
      const replacement = element('select','');
      replacement.add(new Option('Nicht angegeben',''));
      for (const item of readLocations().filter(item=>item.id!==place.id)) replacement.add(new Option(item.name,item.id));
      if (affected.length) {
        const count = affected.reduce((total,entry)=>total+entry.rows.length,0);
        panel.append(element('p',count===1 ? 'Eine Rolle ist betroffen.' : count+' Rollen sind betroffen.'));
        panel.append(element('p','Ohne Ersatzlagerort erscheinen diese Rollen unter „Nicht angegeben“.'));
        const list = element('ul','');
        for (const entry of affected) {
          const item = document.getElementById(entry.key.slice('filament-bestand:'.length));
          const title = item ? item.querySelector('h2').textContent+' · '+item.dataset.color : 'Gespeicherte Filamentkarte';
          for (const {index} of entry.rows) list.append(element('li',title+' · Rolle '+(index+1)));
        }
        const label = element('label','Neuer Lagerort für diese Rollen');
        label.append(replacement);
        panel.append(list,label);
      } else {
        panel.append(element('p','Diesem Lagerort sind keine Rollen zugewiesen.'));
      }
      const confirm = element('button','Lagerort endgültig entfernen');
      const cancel = element('button','Abbrechen');
      confirm.type = cancel.type = 'button';
      cancel.onclick = () => { panel.remove(); trigger.hidden = false; trigger.focus(); };
      confirm.onclick = () => {
        const written = [];
        try {
          const current = affectedStocks(place.id);
          const locations = readLocations();
          if (JSON.stringify(current.map(entry=>[entry.key,entry.raw]))!==JSON.stringify(affected.map(entry=>[entry.key,entry.raw])) ||
              (replacement.value && !locations.some(item=>item.id===replacement.value))) {
            preview();
            feedback.textContent = 'Die Zuordnungen haben sich geändert. Bitte prüfe die Liste erneut.';
            return;
          }
          for (const entry of current) {
            const next = entry.stock.map(roll=>roll?.locationId===place.id ? {...roll,locationId:replacement.value} : roll);
            localStorage.setItem(entry.key,JSON.stringify(next));
            written.push(entry);
          }
          localStorage.setItem(locationKey,JSON.stringify(locations.filter(item=>item.id!==place.id)));
        } catch {
          for (const entry of written.reverse()) {
            try { localStorage.setItem(entry.key,entry.raw); } catch {}
          }
          feedback.textContent = 'Der Lagerort konnte nicht entfernt werden.';
          return;
        }
        changed('Lagerort entfernt.');
      };
      panel.append(confirm,cancel);
    }
    preview();
    return panel;
  }
  function locationForm(place) {
    const editor = element('form','');
    editor.className = 'location-form';
    const row = element('div','');
    row.className = 'stock-weight-save';
    const label = element('label',place ? 'Lagerort umbenennen' : 'Name des neuen Lagerorts');
    const input = element('input','');
    input.required = true;
    input.maxLength = 60;
    input.value = place?.name ?? '';
    label.append(input);
    const save = element('button',place ? 'Änderung speichern' : 'Lagerort hinzufügen');
    save.hidden = save.disabled = true;
    input.oninput = () => {
      const name = input.value.trim();
      save.hidden = save.disabled = !name || name===place?.name;
      feedback.textContent = '';
    };
    editor.onsubmit = event => {
      event.preventDefault();
      if (save.disabled) return;
      const name = input.value.trim();
      const places = readLocations();
      if (places.some(item=>item.id!==place?.id && item.name.normalize('NFKC').toLocaleLowerCase('de')===name.normalize('NFKC').toLocaleLowerCase('de'))) {
        feedback.textContent = 'Diesen Lagerort gibt es bereits.';
        return;
      }
      const next = place ? places.map(item=>item.id===place.id ? {...item,name} : item) : [...places,{id:crypto.randomUUID(),name}];
      try { localStorage.setItem(locationKey,JSON.stringify(next)); }
      catch { feedback.textContent = 'Der Lagerort konnte nicht gespeichert werden.'; return; }
      changed(place ? 'Lagerort umbenannt.' : 'Lagerort hinzugefügt.');
    };
    row.append(label,save);
    editor.append(row);
    if (place) {
      const remove = element('button','Lagerort entfernen');
      remove.type = 'button';
      remove.onclick = () => {
        remove.hidden = true;
        editor.append(removeLocationPanel(place,remove));
      };
      remove.className = 'location-remove-button';
      editor.append(remove);
    }
    return editor;
  }
  function refresh() {
    if (!manager.hidden) renderManager();
  }
  function setOpen(open) {
    manager.hidden = !open;
    manage.setAttribute('aria-expanded',String(open));
    refresh();
  }
  manage.onclick = () => setOpen(manager.hidden);
  setOpen(initiallyOpen);
  return {manage,manager,setOpen};
}
function addLocationSection(card, readStock, saveStock) {
  const details = element('details','');
  details.className = 'locations';
  const summary = element('summary','');
  const panel = element('div','');
  panel.className = 'location-panel';
  const assignments = element('div','');
  const feedback = element('p','');
  feedback.setAttribute('role','status');
  panel.append(assignments,feedback);
  details.append(summary,panel);
  function refreshAssignments() {
    const stock = readStock();
    const locations = readLocations();
    const names = new Map(locations.map(item=>[item.id,item.name]));
    const assigned = [...new Set(stock.map(roll=>names.get(roll.locationId) ?? 'Nicht angegeben'))];
    summary.textContent = 'Lagerort: ' + (assigned.length ? assigned.join(' · ') : 'Keine Rollen im Bestand');
    assignments.replaceChildren();
    if (!stock.length) assignments.append(element('p','Sobald eine Rolle im Bestand ist, kannst du ihr einen Lagerort zuweisen.'));
    stock.forEach((roll,index) => {
      const editor = element('form','');
      editor.className = 'location-form';
      const row = element('div','');
      row.className = 'stock-weight-save';
      const label = element('label',stock.length===1 ? 'Lagerort auswählen' : 'Lagerort für Rolle '+(index+1));
      const select = element('select','');
      select.add(new Option('Nicht angegeben',''));
      for (const place of locations) select.add(new Option(place.name,place.id));
      const previous = names.has(roll.locationId) ? roll.locationId : '';
      select.value = previous;
      label.append(select);
      const save = element('button','Änderung speichern');
      save.hidden = save.disabled = true;
      select.onchange = () => {
        save.hidden = save.disabled = select.value===previous;
        feedback.textContent = '';
      };
      editor.onsubmit = event => {
        event.preventDefault();
        if (save.disabled) return;
        const current = readStock();
        if (!current.some(item=>item.id===roll.id)) { refreshAssignments(); return; }
        if (saveStock(current.map(item=>item.id===roll.id ? {...item,locationId:select.value} : item))) feedback.textContent = 'Gespeichert';
        else feedback.textContent = 'Der Lagerort konnte nicht gespeichert werden.';
      };
      row.append(label,save);
      editor.append(row);
      assignments.append(editor);
    });
  }
  card.addEventListener('locations-changed',refreshAssignments);
  refreshAssignments();
  return {details,refreshAssignments};
}
function dryingRecommendations(card) {
  if (Object.hasOwn(dryingByDevice,card.id)) return dryingByDevice[card.id];
  const values = [...card.querySelectorAll('dl dt')]
    .filter(field=>field.textContent.startsWith('Trocknung'))
    .map(field=>field.nextElementSibling?.textContent.trim())
    .filter(value=>value && value!=='Nicht angegeben');
  if (values.length===2 && card.id.startsWith('sunlu-pla-plus-')) values.push('Gerät nicht angegeben');
  return values.length ? [values.join(' · ')] : [];
}
function createDryingSection(card) {
  const section = element('details','');
  section.className = 'drying-quick';
  const recommendations = dryingRecommendations(card);
  const value = recommendations[0] ?? '';
  const temperature = value.match(/\d+(?:[,.]\d+)?(?:\s*[–-]\s*\d+(?:[,.]\d+)?)?\s*°C/i)?.[0];
  const duration = value.match(/(?:mindestens\s+)?\d+(?:[,.]\d+)?(?:\s*[–-]\s*\d+(?:[,.]\d+)?)?\s*(?:Stunden?|Std\.?|h\b|Minuten?|Min\.?)/i)?.[0];
  const preview = recommendations.length>1 ? 'je nach Gerät' : [temperature,duration].filter(Boolean).join(' · ');
  section.append(element('summary','Trocknung'+(preview ? ' · '+preview : '')));
  section.append(element('p','Herstellerempfehlung'));
  if (recommendations.length) {
    const list = element('ul','');
    for (const recommendation of recommendations) list.append(element('li',recommendation));
    section.append(list);
  } else section.append(element('p','Keine Trocknungsempfehlung hinterlegt.'));
  return section;
}
function addStockSection(card, profile) {
  const section = element('details','');
  section.className = 'stock';
  const summary = element('summary','');
  const entries = element('div','');
  const feedback = element('p','');
  feedback.setAttribute('role','status');
  const quickDrying = createDryingSection(card);
  const dryingEntries = element('div','');
  const dryingFeedback = element('p','');
  dryingFeedback.setAttribute('role','status');
  dryingFeedback.hidden = true;
  quickDrying.append(element('p','Meine Rollen'),dryingEntries,dryingFeedback);
  const storageKey = 'filament-bestand:' + card.id;
  const tareKey = 'filament-spulengewicht:' + card.id;
  let defaultTare = '';
  try { defaultTare = localStorage.getItem(tareKey) ?? ''; } catch {}
  const tareForm = element('form','');
  const tareLabel = element('label','Standard-Leergewicht der Spule (g)');
  const tareInput = element('input','');
  tareInput.type = 'number';
  tareInput.min = '0';
  tareInput.step = 'any';
  tareInput.value = defaultTare;
  tareLabel.append(tareInput);
  const tareRow = element('div','');
  tareRow.className = 'stock-weight-save';
  const tareSave = element('button','Leergewicht speichern');
  const tareSaved = element('span','Gespeichert');
  tareSaved.setAttribute('role','status');
  tareSave.hidden = tareSave.disabled = true;
  tareSaved.hidden = true;
  tareRow.append(tareLabel,tareSave,tareSaved);
  tareForm.append(tareRow);
  tareInput.oninput = tareInput.onchange = () => {
    tareSave.hidden = tareSave.disabled = tareInput.value === defaultTare;
    tareSaved.hidden = true;
  };
  tareForm.onsubmit = event => {
    event.preventDefault();
    if (tareInput.value === defaultTare) return;
    try { localStorage.setItem(tareKey,tareInput.value); }
    catch { feedback.textContent = 'Das Leergewicht konnte nicht gespeichert werden.'; return; }
    defaultTare = tareInput.value;
    tareSave.hidden = tareSave.disabled = true;
    tareSaved.hidden = false;
    renderStock(readStock());
    feedback.textContent = 'Standard-Leergewicht gespeichert.';
  };
  const undo = element('button','Aufbrauchen rückgängig machen');
  undo.className = 'stock-undo';
  undo.type = 'button';
  undo.hidden = true;
  let removed;
  const packaging = {unknown:'Unbekannt',sealed:'Originalverpackt',opened:'Angebrochen'};
  const readStock = () => stockForCard(card.id);
  function saveStock(next, savedRollId) {
    try { localStorage.setItem(storageKey,JSON.stringify(next)); }
    catch { feedback.textContent = 'Der Bestand konnte in diesem Browser nicht gespeichert werden.'; return; }
    renderStock(next,savedRollId);
    location.refreshAssignments();
    filter();
    feedback.textContent = 'Bestand gespeichert.';
    return true;
  }
  function stockForm(roll, index, savedRollId) {
    const editor = element('form','');
    if (roll) editor.append(element('strong','Rolle ' + (index + 1)),element('p',weightDescription(roll,nominalWeight(card))));
    const fields = element('div','');
    fields.className = 'fields';
    const conditionLabel = element('label','Verpackungsstatus');
    const condition = element('select','');
    for (const [value,label] of Object.entries(packaging)) condition.add(new Option(label,value));
    condition.value = roll?.packaging ?? 'sealed';
    conditionLabel.append(condition);
    const weightLabel = element('label','Restgewicht in Gramm (optional)');
    const weight = element('input','');
    weight.type = 'number';
    weight.min = '0';
    weight.step = 'any';
    weight.inputMode = 'decimal';
    weight.value = roll?.weight ?? '';
    weightLabel.append(weight);
    const grossLabel = element('label','Gesamtgewicht mit Spule (g)');
    const gross = weight.cloneNode();
    gross.value = roll?.gross ?? '';
    grossLabel.append(gross);
    const emptyLabel = element('label','Leergewicht dieser Spule (g)');
    const empty = weight.cloneNode();
    empty.value = roll?.tare || defaultTare;
    emptyLabel.append(empty);
    const manualWeight = weight.value;
    function updateWeight() {
      const hasGross = gross.value !== '';
      weight.readOnly = hasGross;
      const invalid = hasGross && (empty.value === '' || Number(gross.value) < Number(empty.value));
      gross.setCustomValidity(invalid ? 'Gib ein Leergewicht ein, das höchstens so groß wie das Gesamtgewicht ist.' : '');
      if (hasGross) weight.value = invalid ? '' : String(Math.round((Number(gross.value)-Number(empty.value))*1000)/1000);
    }
    let manual = manualWeight;
    weight.oninput = () => { if (!weight.readOnly) manual = weight.value; };
    gross.oninput = () => { if (gross.value === '') weight.value = manual; updateWeight(); };
    empty.oninput = updateWeight;
    updateWeight();
    fields.append(conditionLabel,grossLabel,emptyLabel,weightLabel);
    const save = element('button',roll ? 'Änderung speichern' : 'Rolle speichern');
    editor.append(fields);
    if (roll) {
      const row = element('div','');
      row.className = 'stock-weight-save';
      weightLabel.before(row);
      const saved = element('span','Gespeichert');
      saved.setAttribute('role','status');
      row.append(weightLabel,save,saved);
      const inputs = [condition,gross,empty,weight];
      const original = inputs.map(input=>input.value);
      const updateSaveButton = () => {
        saved.hidden = true;
        save.hidden = !inputs.some((input,index)=>input.value!==original[index]);
        save.disabled = save.hidden;
      };
      editor.addEventListener('input',updateSaveButton);
      editor.addEventListener('change',updateSaveButton);
      editor.addEventListener('keydown',event => {
        if (event.key==='Enter' && event.target instanceof HTMLInputElement) event.preventDefault();
      });
      updateSaveButton();
      saved.hidden = roll.id !== savedRollId;
    } else {
      editor.append(save);
    }
    editor.onsubmit = event => {
      event.preventDefault();
      if (roll && save.hidden) return;
      const stock = readStock();
      const updated = {...stock.find(item=>item.id===roll?.id),id:roll?.id ?? crypto.randomUUID(),packaging:condition.value,weight:weight.value,gross:gross.value,tare:empty.value};
      saveStock(roll ? stock.map(item=>item.id===roll.id ? updated : item) : [...stock,updated],roll?.id);
    };
    if (roll) {
      const remove = element('button','Rolle aufgebraucht');
      remove.type = 'button';
      remove.style.marginInlineStart = '.5rem';
      remove.onclick = () => {
        const stock = readStock();
        const current = stock.find(item=>item.id===roll.id);
        if (!current || !saveStock(stock.filter(item=>item.id!==roll.id))) return;
        removed = current;
        undo.hidden = false;
        if (availableOnly.checked && card.hidden) { availableOnly.checked = false; filter(); }
        feedback.textContent = 'Rolle als aufgebraucht markiert.';
      };
      editor.append(remove);
    }
    return editor;
  }
  function saveDrying(rollId, session) {
    const current = readStock();
    if (!current.some(item=>item.id===rollId)) return false;
    const saved = saveStock(current.map(item=>item.id===rollId ? {...item,drying:[...(item.drying ?? []),session],dryingDue:false} : item));
    if (saved) {
      dryingFeedback.textContent = 'Trocknung gespeichert.';
      dryingFeedback.hidden = false;
    }
    return saved;
  }
  function renderStock(stock, savedRollId) {
    const parts = ['Bestand: ' + stock.length + (stock.length===1 ? ' Rolle' : ' Rollen')];
    for (const [status,label] of [['sealed','originalverpackt'],['opened','angebrochen']]) {
      const count = stock.filter(item=>item.packaging===status).length;
      if (count) parts.push(count + ' ' + label);
    }
    parts.push(...weightTotals(stock,nominalWeight(card)));
    card.dataset.stockCount = String(stock.length);
    summary.textContent = parts.join(' · ');
    const add = element('button','Rolle hinzufügen');
    add.type = 'button';
    add.className = 'stock-add';
    add.setAttribute('aria-expanded','false');
    const draft = element('div','');
    draft.hidden = true;
    add.onclick = () => {
      if (!draft.hidden) return;
      const editor = stockForm(null);
      const cancel = element('button','Abbrechen');
      cancel.type = 'button';
      cancel.className = 'stock-cancel';
      cancel.onclick = () => {
        draft.hidden = true;
        draft.replaceChildren();
        add.setAttribute('aria-expanded','false');
        add.focus();
      };
      editor.append(cancel);
      draft.replaceChildren(editor);
      draft.hidden = false;
      add.setAttribute('aria-expanded','true');
      editor.querySelector('select').focus();
    };
    const rows = stock.map((roll,index)=>{
      const row = element('div','');
      row.className = 'stock-roll-entry';
      row.append(stockForm(roll,index,savedRollId),dryingHistory(roll,session=>saveDrying(roll.id,session)));
      return row;
    });
    entries.replaceChildren(...rows,add,draft);
    dryingEntries.replaceChildren(...stock.map((roll,index)=>{
      const history = dryingHistory(roll,session=>saveDrying(roll.id,session));
      const title = history.querySelector('summary');
      const latest = title.textContent.startsWith('Zuletzt getrocknet') ? ' · '+title.textContent : '';
      title.textContent = 'Rolle '+(index+1)+' · Trocknung erfassen'+latest;
      return history;
    }));
    if (!stock.length) dryingEntries.append(element('p','Keine Rollen im Bestand.'));
  }
  undo.onclick = () => {
    if (!removed || !saveStock([...readStock(),removed])) return;
    removed = null;
    undo.hidden = true;
    feedback.textContent = 'Rolle wieder zum Bestand hinzugefügt.';
  };
  section.append(summary,element('p','Der Bestand wird in diesem Browser gespeichert. Gib das Restgewicht direkt ein oder wiege die komplette Rolle und trage das Leergewicht ein.'),tareForm,feedback,undo,entries);
  const location = addLocationSection(card,readStock,saveStock);
  dryingActions.set(card,{
    saveDrying,
    markDue(rollId,dryingDue) {
      const current = readStock();
      if (!current.some(item=>item.id===rollId)) return false;
      return saveStock(current.map(item=>item.id===rollId ? {...item,dryingDue} : item));
    }
  });
  card.addEventListener('stock-batch-added',()=>{
    renderStock(readStock());
    location.refreshAssignments();
  });
  profile.after(quickDrying,location.details,section);
  renderStock(readStock());
}
const printerKey = 'filament-drucker';
const x2d = {id:'x2d',name:'Bambu Lab X2D',diameters:['0,4','0,4']};
function readPrinters() {
  try {
    const saved = JSON.parse(localStorage.getItem(printerKey));
    if (Array.isArray(saved)) return [x2d,...saved];
  } catch {}
  return [x2d];
}
function nozzleName(printer,index) {
  if (printer.id==='x2d') return index===0 ? 'Hauptdüse' : 'Nebendüse';
  return printer.diameters.length===1 ? 'Düse' : 'Düse '+(index+1);
}
const nozzleVariantKey = 'filament-duesenvarianten';
function readNozzleVariants() {
  try {
    const saved = JSON.parse(localStorage.getItem(nozzleVariantKey));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [];
}
function printerNozzles(printer) {
  const variants = readNozzleVariants().filter(item=>item.printerId===printer.id);
  return printer.diameters.flatMap((diameter,index)=>[
    {id:String(index),position:index,diameter},
    ...variants.filter(item=>item.position===index)
  ]);
}
const materialTypes = ['PLA','PLA+','PETG','ABS','ASA','TPU','TPE','PA','PC','PVA','HIPS','PP','PCTG','PET','Stützmaterial'];
const colorFamilies = ['Schwarz','Weiß','Grau','Beige','Braun','Rot','Orange','Gelb','Grün','Türkis','Blau','Lila','Rosa','Silber','Gold','Transparent','Mehrfarbig','Sonstige'];
function materialType(title, explicit = '') {
  const value = explicit.trim();
  if (value) return materialTypes.find(type=>type.toLowerCase()===value.toLowerCase()) ?? value.toUpperCase();
  if (/stützmaterial/i.test(title)) return 'Stützmaterial';
  if (/\bPLA\+/i.test(title)) return 'PLA+';
  return title.match(/\b(PCTG|PETG|PLA|ABS|ASA|TPU|TPE|PVA|HIPS|PP|PET|PC|PA)(?=$|[\W\d])/i)?.[0].toUpperCase() ?? 'Sonstige';
}
function validColor(value) { return typeof value==='string' && /^#[0-9a-f]{6}$/i.test(value); }
function presetColor(name) {
  const preset = Object.keys(colors).find(color=>color.toLocaleLowerCase('de')===name.trim().toLocaleLowerCase('de'));
  return colors[preset];
}
function colorFamily(name, explicit = '') {
  if (colorFamilies.includes(explicit)) return explicit;
  const text = normalizeSearch(name);
  if (/anthrazit/.test(text)) return 'Grau';
  if (/weiss|elfenbein/.test(text)) return 'Weiß';
  return colorFamilies.find(family=>text.includes(normalizeSearch(family))) ?? 'Sonstige';
}
function makeSwatch(shade) {
  const swatch = element('span','');
  swatch.className = 'swatch';
  if (shade) swatch.style.setProperty('--swatch',shade);
  swatch.setAttribute('aria-hidden','true');
  return swatch;
}
function prepareCard(card, color, metadata = {}) {
  const title = card.querySelector('h2').textContent;
  card.dataset.material = materialType(title,metadata.materialart);
  card.dataset.colorFamily = colorFamily(color,metadata.farbfamilie);
  const shade = validColor(metadata.farbton) ? metadata.farbton : presetColor(color);
  card.dataset.color = color;
  const swatch = makeSwatch(shade);
  const label = card.querySelector('.label');
  label.textContent = color;
  const heading = card.querySelector('h2');
  const cardHeading = element('div','');
  cardHeading.className = 'card-heading';
  const text = element('div','');
  text.className = 'card-heading-text';
  label.before(cardHeading);
  text.append(label,heading);
  if (shade) cardHeading.append(swatch);
  cardHeading.append(text);
  const profile = element('details','');
  profile.append(element('summary','Eigene Druckwerte'));
  const editor = element('form','');
  editor.append(element('p','Diese Werte werden in diesem Browser gespeichert.'));
  const fields = element('div','');
  fields.className = 'fields';
  const printerLabel = element('label','Drucker');
  const printerSelect = element('select','');
  printerLabel.append(printerSelect);
  const nozzleLabel = element('label','Düse');
  const nozzle = element('select','');
  nozzleLabel.append(nozzle);
  const choice = element('div','');
  choice.className = 'fields';
  choice.append(printerLabel,nozzleLabel);
  editor.append(choice);
  const drafts = new Map();
  let activePrinter = x2d;
  let activeNozzle = '0';
  function refreshPrinterOptions() {
    printerSelect.replaceChildren(...readPrinters().map(printer=>new Option(printer.name,printer.id)));
    printerSelect.value = activePrinter.id;
  }
  function refreshNozzleOptions() {
    const options = printerNozzles(activePrinter);
    nozzle.replaceChildren(...options.map(item=>new Option(nozzleName(activePrinter,item.position)+(item.diameter?' · '+item.diameter+' mm':''),item.id)));
    nozzle.value = activeNozzle;
    nozzleLabel.hidden = options.length===1;
  }
  function profileStorageKey() {
    if (activePrinter.id==='x2d' && (activeNozzle==='0' || activeNozzle==='1')) return 'filament-x2d:'+card.id+(activeNozzle==='1'?':secondary':'');
    return 'filament-druckprofil:'+activePrinter.id+':'+activeNozzle+':'+card.id;
  }
  function readProfile() {
    try { return JSON.parse(localStorage.getItem(profileStorageKey())) ?? {}; }
    catch { return {}; }
  }
  refreshPrinterOptions();
  refreshNozzleOptions();
  card.addEventListener('printers-changed',() => { refreshPrinterOptions(); refreshNozzleOptions(); });
  const saved = readProfile();
  for (const [name,label] of Object.entries({duese:'Düsentemperatur (°C)',platte:'Druckplatte',bett:'Druckbett (°C)',fluss:'Maximaler Volumenstrom (mm³/s)',kWert:'K-Wert',flussverhaeltnis:'Flussverhältnis',notiz:'Notizen'})) {
    const field = element('label',label);
    const input = element('input','');
    input.name = name;
    input.maxLength = 200;
    if (name === 'kWert' || name === 'flussverhaeltnis') input.inputMode = 'decimal';
    input.value = saved[name] ?? '';
    field.append(input);
    fields.append(field);
  }
  const message = element('p','');
  message.setAttribute('role','status');
  const save = element('button','Änderung speichern');
  editor.append(fields);
  for (const field of [...fields.children]) {
    const row = element('div','');
    row.className = 'profile-save-row stock-weight-save';
    field.before(row);
    row.append(field);
  }
  fields.lastElementChild.append(save,message);
  let baseline = saved;
  const inputs = [...fields.querySelectorAll('input')];
  fields.classList.add('profile-fields');
  const orderKey = '__reihenfolge';
  const orderStatus = element('p','');
  orderStatus.setAttribute('role','status');
  const orderHelp = element('p','Am Griff halten und nach oben oder unten ziehen.');
  const keyboardHelp = element('span',' Mit der Tastatur kannst du am Griff die Pfeiltasten verwenden.');
  keyboardHelp.className = 'profile-order-keyboard';
  orderHelp.append(keyboardHelp);
  editor.insertBefore(orderHelp,fields);
  editor.append(orderStatus);
  const rowName = row => row.querySelector('input').name;
  const fieldOrder = () => [...fields.children].map(rowName);
  function applyFieldOrder(order) {
    const rows = new Map([...fields.children].map(row=>[rowName(row),row]));
    for (const name of order) {
      if (rows.has(name)) { fields.append(rows.get(name)); rows.delete(name); }
    }
    for (const row of rows.values()) fields.append(row);
  }
  function loadFieldOrder(values) {
    try {
      const order = JSON.parse(values[orderKey] ?? '[]');
      if (Array.isArray(order) && order.length) applyFieldOrder(order);
      else applyFieldOrder(inputs.map(input=>input.name));
    } catch { applyFieldOrder(inputs.map(input=>input.name)); }
    orderStatus.textContent = '';
  }
  function saveFieldOrder(before) {
    const order = JSON.stringify(fieldOrder());
    if (order===JSON.stringify(before)) return;
    try {
      localStorage.setItem(profileStorageKey(),JSON.stringify({...readProfile(),[orderKey]:order}));
      baseline = {...baseline,[orderKey]:order};
      orderStatus.textContent = 'Reihenfolge gespeichert.';
    } catch {
      applyFieldOrder(before);
      orderStatus.textContent = 'Die Reihenfolge konnte nicht gespeichert werden.';
    }
  }
  const attachOrderHandle = bindVerticalOrder(fields,fieldOrder,applyFieldOrder,saveFieldOrder);
  const addOrderHandle = row => attachOrderHandle(row,row.querySelector('label').textContent);
  for (const row of fields.children) addOrderHandle(row);
  const customPrefix = 'eigen:';
  function appendCustomField(name,value) {
    const row = element('div','');
    row.className = 'profile-save-row stock-weight-save custom-profile-row';
    const label = element('label',name);
    const input = element('input','');
    input.name = customPrefix+name;
    input.maxLength = 200;
    input.value = value;
    label.append(input);
    row.append(label);
    addOrderHandle(row);
    fields.append(row);
    return input;
  }
  function renderCustomFields(values) {
    const standardRow = inputs.at(-1).closest('.profile-save-row');
    standardRow.append(save,message);
    for (const row of fields.querySelectorAll('.custom-profile-row')) row.remove();
    for (const [name,value] of Object.entries(values)) {
      if (name.startsWith(customPrefix) && name.length>customPrefix.length) appendCustomField(name.slice(customPrefix.length),value);
    }
  }
  const add = element('button','Eigenen Wert hinzufügen');
  add.type = 'button';
  add.setAttribute('aria-expanded','false');
  const customEditor = element('div','');
  customEditor.className = 'custom-profile-editor';
  customEditor.hidden = true;
  const nameLabel = element('label','Name des eigenen Werts');
  const nameInput = element('input','');
  nameInput.placeholder = 'z. B. Bauteillüfter (%)';
  nameInput.maxLength = 60;
  nameLabel.append(nameInput);
  const create = element('button','Feld hinzufügen');
  create.type = 'button';
  const customStatus = element('p','');
  customStatus.setAttribute('role','status');
  customEditor.append(nameLabel,create,customStatus);
  editor.append(add,customEditor);
  add.onclick = () => {
    customEditor.hidden = !customEditor.hidden;
    add.setAttribute('aria-expanded',String(!customEditor.hidden));
    if (!customEditor.hidden) nameInput.focus();
  };
  create.onclick = () => {
    const name = nameInput.value.trim().replace(/\s+/g,' ');
    if (!name) { customStatus.textContent = 'Gib einen Namen für das Feld ein.'; return; }
    const normalized = name.normalize('NFKC').toLocaleLowerCase('de');
    if ([...fields.querySelectorAll('label')].some(label=>label.textContent.normalize('NFKC').toLocaleLowerCase('de')===normalized)) {
      customStatus.textContent = 'Ein Feld mit diesem Namen gibt es bereits.';
      return;
    }
    const input = appendCustomField(name,'');
    nameInput.value = '';
    customStatus.textContent = '';
    customEditor.hidden = true;
    add.setAttribute('aria-expanded','false');
    onProfileEdit({target:input});
    input.focus();
  };
  nameInput.onkeydown = event => {
    if (event.key==='Enter') { event.preventDefault(); create.click(); }
  };
  renderCustomFields(saved);
  loadFieldOrder(saved);
  function updateSaveButton() {
    const changed = [...fields.querySelectorAll('input')].some(input=>input.value!==(baseline[input.name] ?? '') || (input.name.startsWith(customPrefix) && !Object.hasOwn(baseline,input.name)));
    save.hidden = save.disabled = !changed;
  }
  function onProfileEdit(event) {
    const row = event?.target.closest('.profile-save-row');
    if (row && row !== save.parentElement) row.append(save,message);
    message.textContent = '';
    message.hidden = true;
    updateSaveButton();
  }
  editor.addEventListener('input',onProfileEdit);
  editor.addEventListener('change',onProfileEdit);
  editor.addEventListener('keydown',event => {
    if (event.key==='Enter' && event.target instanceof HTMLInputElement) event.preventDefault();
  });
  function switchProfile(printer,index) {
    drafts.set(profileStorageKey(),Object.fromEntries(new FormData(editor)));
    activePrinter = printer;
    activeNozzle = index;
    refreshNozzleOptions();
    baseline = readProfile();
    const values = drafts.get(profileStorageKey()) ?? baseline;
    for (const input of inputs) input.value = values[input.name] ?? '';
    renderCustomFields(values);
    loadFieldOrder(baseline);
    nameInput.value = '';
    customStatus.textContent = '';
    customEditor.hidden = true;
    add.setAttribute('aria-expanded','false');
    onProfileEdit();
  }
  printerSelect.onchange = () => switchProfile(readPrinters().find(printer=>printer.id===printerSelect.value) ?? x2d,'0');
  nozzle.onchange = () => switchProfile(activePrinter,nozzle.value);
  editor.onsubmit = event => {
    event.preventDefault();
    if (save.disabled) return;
    const values = Object.fromEntries(new FormData(editor));
    try {
      const order = readProfile()[orderKey];
      if (typeof order==='string') values[orderKey] = order;
      localStorage.setItem(profileStorageKey(),JSON.stringify(values));
      baseline = values;
      updateSaveButton();
      message.textContent = 'Gespeichert';
    } catch { message.textContent = 'Speichern in diesem Browser fehlgeschlagen.'; }
    message.hidden = false;
  };
  onProfileEdit();
  profile.append(editor);
  cardHeading.after(profile);
  addStockSection(card,profile);
}
function addQr(card, packed) {
  const qr = element('details','');
  qr.append(element('summary','QR-Code zum Nachdrucken'));
  const canvas = element('canvas','');
  canvas.width = canvas.height = 720;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0,0,720,720);
  context.fillStyle = '#000';
  const bits = atob(packed);
  for (let i = 0; i < 37 * 37; i++) {
    if (bits.charCodeAt(i >> 3) & (128 >> (i % 8))) context.fillRect((i % 37 + 4) * 16,(Math.floor(i / 37) + 4) * 16,16,16);
  }
  const image = element('img','');
  image.alt = 'QR-Code für ' + card.querySelector('h2').textContent + ' · ' + card.dataset.color;
  image.width = image.height = 176;
  image.src = canvas.toDataURL();
  const download = element('a','QR-Code als PNG herunterladen');
  download.href = image.src;
  download.download = 'QR-' + card.id + '.png';
  qr.append(image,download);
  card.append(qr);
}
for (const card of cards.querySelectorAll('article[id]')) {
  const specs = card.querySelector('dl');
  const sharedSpecs = document.getElementById('specs-' + card.dataset.product);
  if (sharedSpecs) specs.prepend(sharedSpecs.content.cloneNode(true));
  prepareCard(card,card.querySelector('.label').textContent.split(' · ')[1]);
  const manufacturer = element('details','');
  manufacturer.append(element('summary','Herstellerangaben'));
  specs.before(manufacturer);
  manufacturer.append(specs,...card.querySelectorAll(':scope > p'));
  const drying = [...specs.children].filter(field=>field.querySelector('dt').textContent.startsWith('Trocknung'));
  if (qrCodes[card.id]) addQr(card,qrCodes[card.id]);
  const directLink = card.querySelector('.open-roll');
  if (directLink) {
    const share = element('button','Link zum Filament teilen');
    share.type = 'button';
    const message = element('p','');
    message.setAttribute('role','status');
    message.hidden = true;
    const address = element('input','');
    address.readOnly = true;
    address.hidden = true;
    address.setAttribute('aria-label','Link zur Filamentkarte');
    address.value = directLink.href;
    directLink.href = '#bestand/'+card.id;
    share.onclick = async () => {
      try {
        if (navigator.share) {
          await navigator.share({title:card.querySelector('h2').textContent,url:address.value});
          return;
        }
        await navigator.clipboard.writeText(address.value);
        message.textContent = 'Link kopiert.';
      } catch (error) {
        if (error.name === 'AbortError') return;
        address.hidden = false;
        address.focus();
        address.select();
        message.textContent = 'Du kannst den markierten Link kopieren.';
      }
      message.hidden = false;
    };
    card.append(share,message,address);
  }
  if (drying.length !== 2) continue;
  drying[0].querySelector('dt').textContent = 'Trocknung nach Gerät';
  const values = dryingRecommendations(card);
  const list = element('ul','');
  const sources = [...manufacturer.querySelectorAll('p:not(.product-link) a[href]')];
  for (const value of values) {
    const item = element('li',value);
    let source = sources[0];
    if (value.includes('französischer EU-Shop')) source = sources.find(link=>link.pathname.startsWith('/fr/')) ?? source;
    else if (value.includes('Datenblatt')) source = sources.find(link=>link.pathname.endsWith('.pdf')) ?? source;
    if (source) {
      const link = element('a','Quelle');
      link.href = source.href;
      link.setAttribute('aria-label','Quelle für '+value);
      item.append(' · ',link);
    }
    list.append(item);
  }
  drying[0].querySelector('dd').replaceChildren(list);
  drying[0].classList.add('drying');
  drying[1].remove();
}
function updateFilterOptions() {
  for (const [select,key,all] of [[materialFilter,'material','Alle Materialien'],[colorFilter,'colorFamily','Alle Farbfamilien']]) {
    const selected = select.value;
    select.replaceChildren(new Option(all,''));
    const options = [...new Set([...cards.children].filter(card=>!card.hasAttribute('data-shared-filament')).map(card=>card.dataset[key]))].sort((a,b)=>a.localeCompare(b,'de'));
    for (const value of options) select.add(new Option(value,value));
    if (options.includes(selected)) select.value = selected;
  }
}
const menu = document.querySelector('#main-menu');
const locationOverview = document.querySelector('#bestand-lagerort');
function bindVerticalOrder(fields,fieldOrder,applyFieldOrder,saveFieldOrder,boundsOf = row=>row.getBoundingClientRect()) {
  let drag;
  function moveAt(y) {
    const target = [...fields.children].filter(row=>row!==drag.row).find(row=>{
      const bounds = boundsOf(row);
      return y < (bounds.top+bounds.bottom)/2;
    });
    if (target ? drag.row.nextElementSibling!==target : drag.row!==fields.lastElementChild) fields.insertBefore(drag.row,target ?? null);
  }
  function startDrag(row,id,y,touch) {
    row.classList.add('profile-dragging');
    const {top,bottom} = boundsOf(row);
    drag = {row,id,startY:y,offset:(top+bottom)/2-y,before:fieldOrder(),moved:false,touch};
  }
  function updateDrag(y) {
    if (!drag.moved && Math.abs(y-drag.startY)<5) return;
    drag.moved = true;
    moveAt(y+drag.offset);
  }
  function endDrag(commit) {
    const {row,before,touch} = drag;
    drag = null;
    row.classList.remove('profile-dragging');
    if (touch) {
      document.removeEventListener('touchmove',moveTouch,true);
      document.removeEventListener('touchend',endTouch,true);
      document.removeEventListener('touchcancel',endTouch,true);
    }
    if (commit) saveFieldOrder(before);
    else applyFieldOrder(before);
  }
  function moveTouch(event) {
    const touch = [...event.touches].find(item=>item.identifier===drag.id);
    if (!touch) return;
    if (event.cancelable) event.preventDefault();
    updateDrag(touch.clientY);
  }
  function endTouch(event) {
    if ([...event.changedTouches].some(item=>item.identifier===drag.id)) endDrag(event.type==='touchend');
  }
  function tracksPointer(event) {
    return drag && !drag.touch && drag.id===event.pointerId;
  }
  fields.onpointermove = event => { if (tracksPointer(event)) updateDrag(event.clientY); };
  fields.onpointerup = event => { if (tracksPointer(event)) endDrag(true); };
  fields.onpointercancel = fields.onlostpointercapture = event => { if (tracksPointer(event)) endDrag(false); };
  function addOrderHandle(row,label) {
    const handle = element('button','');
    handle.type = 'button';
    handle.className = 'profile-order-handle';
    handle.setAttribute('aria-label',label+' verschieben');
    handle.title = 'Nach oben oder unten verschieben';
    handle.addEventListener('touchstart',event=>{
      if (drag || event.touches.length!==1 || !event.cancelable) return;
      event.preventDefault();
      const touch = event.changedTouches[0];
      startDrag(row,touch.identifier,touch.clientY,true);
      document.addEventListener('touchmove',moveTouch,{capture:true,passive:false});
      document.addEventListener('touchend',endTouch,true);
      document.addEventListener('touchcancel',endTouch,true);
    },{passive:false});
    handle.onpointerdown = event => {
      if (event.pointerType==='touch' || event.button!==0 || drag) return;
      event.preventDefault();
      fields.setPointerCapture(event.pointerId);
      startDrag(row,event.pointerId,event.clientY,false);
    };
    handle.onkeydown = event => {
      if (event.key!=='ArrowUp' && event.key!=='ArrowDown') return;
      event.preventDefault();
      const adjacent = event.key==='ArrowUp' ? row.previousElementSibling : row.nextElementSibling;
      if (!adjacent) return;
      const before = fieldOrder();
      fields.insertBefore(row,event.key==='ArrowUp' ? adjacent : adjacent.nextElementSibling);
      saveFieldOrder(before);
      handle.focus();
    };
    row.prepend(handle);
  }
  return addOrderHandle;
}
const locationGroups = document.querySelector('#location-stock-groups');
function stockForCard(cardId) {
  try {
    const saved = JSON.parse(localStorage.getItem('filament-bestand:' + cardId));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [{id:'erste-rolle',packaging:'unknown',weight:''}];
}
const openLocationGroups = new Set();
const locationOrderKey = 'filament-lagerorte-reihenfolge';
function readLocationOrder() {
  try {
    const order = JSON.parse(localStorage.getItem(locationOrderKey));
    if (Array.isArray(order)) return order;
  } catch {}
  return [];
}
function renderLocationOverview(message = '', managerOpen = false) {
  const places = readLocations();
  const groups = new Map(places.map(place=>[place.id,{name:place.name,items:[]}]));
  const unassigned = {name:'Nicht angegeben',items:[]};
  for (const card of cards.querySelectorAll('article[id]')) {
    const title = card.querySelector('h2').textContent+' · '+card.dataset.color;
    const nominal = nominalWeight(card);
    for (const [index,roll] of stockForCard(card.id).entries()) {
      const group = groups.get(roll.locationId) ?? unassigned;
      group.items.push({id:card.id,title,nominal,weight:roll.weight,packaging:roll.packaging,rollId:roll.id,index,locationId:roll.locationId ?? ''});
    }
  }
  const selected = new Map();
  const checkboxes = [];
  const transfer = element('form','');
  transfer.className = 'stock-transfer';
  transfer.hidden = true;
  const toggle = element('button','Mehrfachauswahl');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded','false');
  const status = element('p','');
  status.setAttribute('role','status');
  const destinationLabel = element('label','Neuer Lagerort');
  const destination = element('select','');
  destination.required = true;
  destination.add(new Option('Ziel auswählen',''));
  destination.add(new Option('Nicht angegeben','unassigned'));
  for (const place of readLocations()) destination.add(new Option(place.name,'id:'+place.id));
  destination.add(new Option('Neuen Lagerort erstellen','create'));
  destinationLabel.append(destination);
  const newLabel = element('label','Name des neuen Lagerorts');
  const newName = element('input','');
  newName.maxLength = 60;
  newLabel.hidden = true;
  newLabel.append(newName);
  const save = element('button','Umlagern');
  const cancel = element('button','Abbrechen');
  cancel.type = 'button';
  const selectedCount = element('p','0 Rollen ausgewählt');
  const controls = element('div','');
  controls.className = 'fields';
  controls.append(destinationLabel,newLabel);
  transfer.append(selectedCount,controls,save,cancel);
  function refreshSelection() {
    selectedCount.textContent = selected.size+(selected.size===1?' Rolle ausgewählt':' Rollen ausgewählt');
    const targetName = destination.value==='create' ? newName.value.trim() : destination.selectedOptions[0]?.textContent;
    const targetId = destination.value.startsWith('id:') ? destination.value.slice(3) : '';
    const count = [...selected.values()].filter(item=>destination.value==='create' || item.locationId!==targetId).length;
    save.disabled = !destination.value || !targetName || !count;
    save.textContent = save.disabled ? 'Umlagern' : (count===1?'1 Rolle':count+' Rollen')+' umlagern – '+targetName;
  }
  destination.onchange = () => {
    newLabel.hidden = destination.value!=='create';
    newName.required = !newLabel.hidden;
    refreshSelection();
  };
  newName.oninput = refreshSelection;
  let mode = '';
  function setTransferMode(nextMode, host, item) {
    mode = nextMode;
    selected.clear();
    for (const entry of checkboxes) { entry.box.checked = false; entry.box.indeterminate = false; }
    transfer.reset();
    newLabel.hidden = true;
    newName.required = false;
    if (item) selected.set(JSON.stringify([item.id,item.rollId]),item);
    for (const option of destination.options) {
      const source = item?.locationId ? 'id:'+item.locationId : 'unassigned';
      option.disabled = Boolean(item && option.value===source);
    }
    transfer.hidden = !mode;
    toggle.textContent = mode==='multiple' ? 'Auswahl beenden' : 'Mehrfachauswahl';
    toggle.setAttribute('aria-expanded',String(mode==='multiple'));
    locationGroups.classList.toggle('selecting-stock',mode==='multiple');
    if (mode==='multiple') {
      setManagerOpen(false);
      managerFeedback.textContent = '';
    }
    status.textContent = '';
    if (host) host.append(transfer,status);
    else management.after(transfer,status);
    refreshSelection();
    if (host) destination.focus();
  }
  toggle.onclick = () => setTransferMode(mode==='multiple' ? '' : 'multiple');
  cancel.onclick = () => {
    const trigger = mode==='single' ? transfer.parentElement.querySelector('button') : toggle;
    setTransferMode('');
    trigger?.focus();
  };
  function checkbox(labelText, items) {
    const label = element('label',labelText);
    label.className = 'stock-move-choice';
    const box = element('input','');
    box.type = 'checkbox';
    label.prepend(box);
    box.onchange = () => {
      for (const item of items) {
        const key = JSON.stringify([item.id,item.rollId]);
        if (box.checked) selected.set(key,item);
        else selected.delete(key);
      }
      for (const entry of checkboxes) {
        const count = entry.items.filter(item=>selected.has(JSON.stringify([item.id,item.rollId]))).length;
        entry.box.checked = count===entry.items.length;
        entry.box.indeterminate = count>0&&count<entry.items.length;
      }
      refreshSelection();
    };
    checkboxes.push({box,items});
    return label;
  }
  transfer.onsubmit = event => {
    event.preventDefault();
    if (save.disabled) return;
    const places = readLocations();
    const newPlace = destination.value==='create' ? {id:crypto.randomUUID(),name:newName.value.trim()} : null;
    const targetId = newPlace?.id ?? (destination.value==='unassigned' ? '' : destination.value.slice(3));
    if (newPlace && places.some(place=>place.name.toLocaleLowerCase('de')===newPlace.name.toLocaleLowerCase('de'))) {
      status.textContent = 'Diesen Lagerort gibt es bereits.';
      return;
    }
    if (!newPlace && targetId && !places.some(place=>place.id===targetId)) {
      status.textContent = 'Dieser Lagerort ist nicht mehr vorhanden. Öffne die Lagerortübersicht erneut.';
      return;
    }
    const changes = new Map();
    let moved = 0;
    for (const item of selected.values()) {
      if (!changes.has(item.id)) changes.set(item.id,stockForCard(item.id));
      const stock = changes.get(item.id);
      const index = stock.findIndex(roll=>roll.id===item.rollId);
      if (index<0 || (stock[index].locationId ?? '')!==item.locationId) {
        status.textContent = 'Der Bestand hat sich geändert. Öffne die Lagerortübersicht erneut.';
        return;
      }
      if (item.locationId===targetId) continue;
      stock[index] = {...stock[index],locationId:targetId};
      moved++;
    }
    if (!moved) { status.textContent = 'Die ausgewählten Rollen sind bereits an diesem Lagerort.'; return; }
    const written = [];
    try {
      for (const [id,stock] of changes) {
        const key = 'filament-bestand:'+id;
        const before = localStorage.getItem(key);
        localStorage.setItem(key,JSON.stringify(stock));
        written.push({key,before});
      }
      if (newPlace) localStorage.setItem(locationKey,JSON.stringify([...places,newPlace]));
    } catch {
      for (const {key,before} of written.reverse()) {
        try { if (before===null) localStorage.removeItem(key); else localStorage.setItem(key,before); } catch {}
      }
      status.textContent = 'Die Umlagerung konnte nicht gespeichert werden.';
      return;
    }
    for (const card of cards.children) card.dispatchEvent(new Event('locations-changed'));
    openLocationGroups.add(targetId);
    renderLocationOverview(moved===1?'1 Rolle umgelagert.':moved+' Rollen umgelagert.');
  };
  status.textContent = message;
  locationGroups.classList.remove('selecting-stock');
  const managerFeedback = element('p','');
  managerFeedback.setAttribute('role','status');
  const {manage,manager,setOpen: setManagerOpen} = createLocationManager(message=>renderLocationOverview(message,true),managerFeedback,managerOpen);
  const toolbar = element('div','');
  toolbar.className = 'location-stock-toolbar';
  toolbar.append(toggle,manage);
  const management = element('div','');
  managerFeedback.className = 'location-manager-feedback';
  management.append(manager,managerFeedback);
  locationGroups.replaceChildren(toolbar,management,transfer,status);
  refreshSelection();
  const sortable = element('div','');
  sortable.className = 'location-stock-sortable';
  locationGroups.append(sortable);
  const storedOrder = readLocationOrder();
  const order = [...new Set([...storedOrder,...groups.keys()])].filter(id=>groups.has(id));
  const groupNodes = new Map();
  const currentOrder = () => [...sortable.children].map(group=>group.dataset.locationId);
  const restoreOrder = ids => { for (const id of ids) sortable.append(groupNodes.get(id)); };
  const addGrip = bindVerticalOrder(sortable,currentOrder,restoreOrder,before=>{
    const next = currentOrder();
    if (next.every((id,index)=>id===before[index])) return;
    try { localStorage.setItem(locationOrderKey,JSON.stringify(next)); }
    catch {
      restoreOrder(before);
      status.textContent = 'Die Reihenfolge konnte nicht gespeichert werden.';
    }
  },group=>group.querySelector('summary').getBoundingClientRect());
  if (unassigned.items.length) { groups.set('',unassigned); order.push(''); }
  for (const id of order) {
    const {name,items} = groups.get(id);
    const group = element('section','');
    group.className = 'location-stock-group';
    group.dataset.locationId = id;
    const disclosure = element('details','');
    disclosure.open = openLocationGroups.has(id);
    disclosure.ontoggle = () => {
      if (!disclosure.isConnected) return;
      if (disclosure.open) openLocationGroups.add(id);
      else openLocationGroups.delete(id);
    };
    const content = element('div','');
    content.className = 'location-stock-content';
    disclosure.append(element('summary',name+' · '+items.length+(items.length===1?' Rolle':' Rollen')),content);
    group.append(disclosure);
    if (id) {
      groupNodes.set(id,group);
      addGrip(group,name);
      sortable.append(group);
    } else locationGroups.append(group);
    if (items.length) {
      content.append(checkbox('Alle Rollen an diesem Lagerort auswählen',items));
      const byFilament = new Map();
      for (const item of items) {
        if (!byFilament.has(item.id)) byFilament.set(item.id,[]);
        byFilament.get(item.id).push(item);
      }
      const list = element('ul','');
      for (const rolls of byFilament.values()) {
        const [item] = rolls;
        const line = element('li','');
        const link = element('a',item.title);
        link.href = '#lagerbestand/'+item.id;
        const details = [rolls.length+(rolls.length===1?' Rolle':' Rollen'),...weightTotals(rolls,item.nominal)];
        line.append(link,' · '+details.join(' · '));
        for (const roll of rolls) {
          const rollLabel = 'Rolle '+(roll.index+1)+' · '+weightDescription(roll,item.nominal);
          const row = element('div','');
          row.className = 'location-stock-roll';
          const move = element('button','Umlagern');
          move.type = 'button';
          move.setAttribute('aria-label',item.title+' · '+rollLabel+' umlagern');
          move.onclick = () => setTransferMode('single',row,roll);
          row.append(element('span',rollLabel),move,checkbox(item.title+' · '+rollLabel,[roll]));
          line.append(row);
        }
        list.append(line);
      }
      content.append(list);
    } else content.append(element('p','Keine Rollen an diesem Lagerort.'));
  }
  if (!groups.size) locationGroups.append(element('p','Derzeit sind keine Rollen im Bestand.'));
}
const sharedPrefix = 'filament/';
const publicFields = ['material','farbe',...Object.keys(labels),'produktseite'];
function productPage(value) {
  try {
    const url = new URL(value);
    return (url.protocol==='https:' || url.protocol==='http:') && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
function ownManufacturer(specs, value) {
  const section = element('details','');
  section.append(element('summary','Herstellerangaben'),specs);
  const url = productPage(value);
  if (url) {
    const link = element('a','Produktseite beim Hersteller');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const row = element('p','');
    row.className = 'product-link';
    row.append(link);
    section.append(row);
  }
  return section;
}
let qrLibrary;
function loadQrLibrary() {
  if (!qrLibrary) qrLibrary = new Promise((resolve,reject) => {
    const script = element('script','');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    script.integrity = 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  }).catch(error=>{ qrLibrary = null; throw error; });
  return qrLibrary;
}
function addLocalQr(card, roll, live = false) {
  const data = publicFields.map(field=>roll[field] ?? '');
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  const address = new URL(location.pathname,location.origin);
  address.hash = live ? card.id : sharedPrefix+encoded;
  const section = element('details','');
  section.className = 'local-qr';
  section.append(element('summary',live ? 'Etikett für meine aktuelle Karte' : 'Karte teilen (Momentaufnahme)'),element('p',live ? 'Das Etikett öffnet die aktuelle Karte in einem Browser, in dem sie gespeichert ist.' : 'Der Link enthält die öffentlichen Filamentdaten zum Zeitpunkt der Erstellung.'));
  const message = element('p','');
  message.setAttribute('role','status');
  const copy = element('button','Link kopieren');
  copy.type = 'button';
  const copyField = element('input','');
  copyField.value = address.href;
  copyField.readOnly = true;
  copyField.hidden = true;
  copyField.setAttribute('aria-label','Teilbarer Filamentlink');
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(address.href); message.textContent = 'Link kopiert.'; }
    catch { copyField.hidden = false; copyField.focus(); copyField.select(); message.textContent = 'Du kannst den markierten Link kopieren.'; }
  };
  const imageArea = element('div','');
  section.append(imageArea,copy,copyField,message);
  card.append(section);
  if (!live && encoded.length>32000) {
    copy.disabled = true;
    imageArea.textContent = 'Die Filamentdaten sind zu lang zum Teilen. Kürze die Angaben und speichere die Karte erneut.';
    return;
  }
  let generating = false;
  section.ontoggle = async () => {
    if (!section.open || generating) return;
    generating = true;
    imageArea.textContent = 'QR-Code wird erstellt …';
    try { await loadQrLibrary(); }
    catch { imageArea.textContent = 'QR-Code konnte nicht geladen werden. Du kannst den Link kopieren oder den Abschnitt erneut öffnen.'; generating = false; return; }
    try {
      const qr = qrcode(0,'M');
      qr.addData(address.href,'Byte');
      qr.make();
      const count = qr.getModuleCount();
      const canvas = element('canvas','');
      canvas.width = canvas.height = (count+8)*8;
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.fillStyle = '#000';
      for (let row=0;row<count;row++) for (let column=0;column<count;column++) {
        if (qr.isDark(row,column)) context.fillRect((column+4)*8,(row+4)*8,8,8);
      }
      const png = canvas.toDataURL('image/png');
      const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      const image = element('img','');
      image.alt = 'QR-Code für '+roll.material+' · '+roll.farbe;
      image.width = image.height = 240;
      image.src = png;
      const download = element('a','QR-Code als PNG herunterladen');
      download.href = png;
      download.download = live ? 'Filament-Etikett.png' : 'Filament-Momentaufnahme.png';
      imageArea.replaceChildren(image,download);
      if (blob) {
        const file = new File([blob],download.download,{type:'image/png'});
        const share = element('button','QR-Code teilen');
        share.type = 'button';
        share.onclick = async () => {
          try { await navigator.share({files:[file],title:roll.material+' · '+roll.farbe}); }
          catch (error) { if (error.name!=='AbortError') message.textContent = 'Du kannst den QR-Code als PNG herunterladen und versenden.'; }
        };
        if (navigator.canShare?.({files:[file]})) imageArea.append(' ',share);
        if (window.ClipboardItem && navigator.clipboard?.write) {
          const copyImage = element('button','QR-Bild kopieren');
          copyImage.type = 'button';
          copyImage.onclick = async () => {
            try { await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); message.textContent = 'QR-Bild kopiert.'; }
            catch { message.textContent = 'Du kannst das QR-Bild stattdessen herunterladen.'; }
          };
          imageArea.append(' ',copyImage);
        }
      }
    } catch { imageArea.textContent = 'Für einen QR-Code sind die Angaben zu lang oder der Code konnte nicht erstellt werden. Der teilbare Link ist weiterhin verfügbar.'; }
  };
}
function sharedCardFor(route) {
  const existing = cards.querySelector('[data-shared-filament]');
  if (!route.startsWith(sharedPrefix)) { existing?.remove(); return null; }
  if (existing?.dataset.sharedFilament===route) return existing;
  existing?.remove();
  const card = element('article','');
  card.dataset.sharedFilament = route;
  try {
    const payload = route.slice(sharedPrefix.length);
    if (payload.length>32000 || !/^[A-Za-z0-9_-]+$/.test(payload)) throw Error();
    const bytes = Uint8Array.from(atob(payload.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if (!Array.isArray(data) || (data.length!==publicFields.length && data.length!==publicFields.length-1) || data.some(value=>typeof value!=='string') || !data[0].trim() || !data[1].trim()) throw Error();
    const roll = Object.fromEntries(publicFields.map((field,index)=>[field,data[index]]));
    const label = element('span',roll.farbe);
    label.className = 'label';
    card.append(label,element('h2',roll.material),element('p','Geteilte Filamentkarte · Angaben zum Zeitpunkt der Erstellung.'));
    const specs = element('dl','');
    for (const [field,title] of Object.entries(labels)) {
      const item = element('div','');
      item.append(element('dt',title),element('dd',roll[field] || 'Nicht angegeben'));
      specs.append(item);
    }
    const manufacturer = ownManufacturer(specs,roll.produktseite);
    card.append(manufacturer);
    manufacturer.before(createDryingSection(card));
  } catch { card.append(element('h2','Filamentlink ungültig'),element('p','Der Link ist unvollständig oder enthält ungültige Filamentdaten.')); }
  cards.append(card);
  return card;
}
function normalizeSearch(value) {
  return value.toLocaleLowerCase('de').normalize('NFD').replace(/\p{M}/gu,'').replaceAll('ß','ss').replace(/[^\p{L}\p{N}+]+/gu,' ').trim();
}
let previousRoute = null;
let editReturnRoute = '';
const scrollPositions = new Map();
const listRoutes = new Set(['filament-bestand','bestand-lagerort','trocknung']);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function rememberListPosition() {
  if (listRoutes.has(previousRoute) && location.hash.slice(1)===previousRoute) {
    scrollPositions.set(previousRoute,window.scrollY);
  }
}
window.addEventListener('scroll',rememberListPosition,{passive:true});
document.addEventListener('click',event=>{
  if (event.target.closest?.('a[href^="#"]')) rememberListPosition();
},true);
function filter() {
  const route = location.hash.slice(1);
  const contexts = [
    ['lagerbestand/','bestand-lagerort'],
    ['bestand/','filament-bestand'],
    ['trocknung/','trocknung']
  ];
  const context = contexts.find(([prefix])=>route.startsWith(prefix));
  const id = context ? route.slice(context[0].length) : route;
  const shared = sharedCardFor(route);
  const missingLocalCard = /^eigene-rolle-[a-f0-9-]{36}$/i.test(id) && !document.getElementById(id);
  document.querySelector('#missing-local-card').hidden = !missingLocalCard;
  const target = shared ?? document.getElementById(id);
  const single = target?.parentElement === cards;
  const stockDetail = single && context?.[1]==='bestand-lagerort';
  cards.classList.toggle('stock-detail',stockDetail);
  const returnPage = single ? context?.[1] : null;
  if (returnPage) {
    back.href = '#'+returnPage;
    back.textContent = '← '+pageTitles[returnPage];
  } else if (route==='filament-anlegen' && editing && editReturnRoute) {
    back.href = '#'+editReturnRoute;
    back.textContent = '← Filamentkarte';
  }
  if (stockDetail && route!==previousRoute) target.querySelector('.locations').open = true;
  previousRoute = route;
  const locationsView = target === locationOverview;
  const inventoryView = route==='filament-bestand';
  const createView = route==='filament-anlegen';
  const scanningView = route==='filament-scannen';
  const printersView = route==='meine-drucker';
  const backupView = route==='datensicherung';
  const dryingView = Boolean(dryingDashboard && route==='trocknung');
  const home = !single && !locationsView && !inventoryView && !createView && !scanningView && !printersView && !backupView && !dryingView && !missingLocalCard;
  printerView.hidden = !printersView;
  if (printersView) renderPrinters();
  menu.hidden = !home;
  overview.hidden = !inventoryView;
  const heading = single ? target.querySelector('h2') : null;
  const title = heading ? [heading.textContent,target.dataset.color ?? target.querySelector('.label')?.textContent].filter(Boolean).join(' · ')
    : missingLocalCard ? 'Filamentkarte' : createView && editing ? 'Filament bearbeiten' : pageTitles[route] ?? 'Hauptmenü';
  if (pageNavigation) pageNavigation.hidden = home;
  pageTitle.hidden = Boolean(heading);
  pageTitle.parentElement.hidden = Boolean(heading);
  if (!heading) pageTitle.textContent = title;
  homeIntro.hidden = !home;
  document.title = title+' · Filamentlager';
  back.hidden = !(returnPage || (createView && editing && editReturnRoute));
  if (!pageNavigation && !home && back.hidden) {
    back.href = '#';
    back.textContent = '← Hauptmenü';
    back.hidden = false;
  }
  cards.hidden = !single && !inventoryView;
  locationOverview.hidden = !locationsView;
  filamentEditor.hidden = !createView;
  filamentEditor.open = createView;
  scanView.hidden = !scanningView;
  document.querySelector('#datensicherung').hidden = !backupView;
  if (dryingDashboard) dryingDashboard.hidden = !dryingView;
  if (dryingView) renderDryingDashboard();
  if (locationsView) renderLocationOverview();
  const terms = normalizeSearch(search.value).split(' ').filter(Boolean);
  for (const card of cards.children) {
    const cardTitle = card.querySelector('h2');
    const isActive = single && card===target;
    if (isActive) {
      cardTitle.setAttribute('aria-level','1');
      cardTitle.setAttribute('aria-label',title);
    } else {
      cardTitle?.removeAttribute('aria-level');
      cardTitle?.removeAttribute('aria-label');
    }
    cardTitle?.classList.toggle('card-page-title',isActive);
    const openCard = card.querySelector('.open-roll');
    if (openCard) openCard.hidden = single;
    const name = cardTitle?.textContent ?? '';
    const searchable = normalizeSearch([name,card.dataset.material,card.dataset.color].join(' '));
    const matches = terms.every(term=>searchable.includes(term));
    card.hidden = single ? card !== target : !matches || (availableOnly.checked && card.dataset.stockCount === '0') || (materialFilter.value && card.dataset.material !== materialFilter.value) || (colorFilter.value && card.dataset.colorFamily !== colorFilter.value);
  }
  document.querySelector('#empty').hidden = !inventoryView || [...cards.children].some(card => !card.hidden);
}
materialFilter.onchange = colorFilter.onchange = availableOnly.onchange = filter;
window.addEventListener('hashchange', () => {
  const route = location.hash.slice(1);
  filter();
  requestAnimationFrame(()=>{
    if (location.hash.slice(1)===route) window.scrollTo(0,scrollPositions.get(route) ?? 0);
  });
});
function updateLocalCardColor(card,roll) {
  card.dataset.color = roll.farbe;
  card.dataset.colorFamily = colorFamily(roll.farbe,roll.farbfamilie);
  const heading = card.querySelector('.card-heading');
  heading.querySelector('.label').textContent = roll.farbe;
  heading.querySelector('.swatch')?.remove();
  const shade = validColor(roll.farbton) ? roll.farbton : presetColor(roll.farbe);
  if (shade) heading.prepend(makeSwatch(shade));
  card.querySelectorAll('.local-qr').forEach(section=>section.remove());
  addLocalQr(card,roll,true);
  addLocalQr(card,roll);
  updateFilterOptions();
  filter();
}
function render() {
  cards.querySelectorAll('[data-local]').forEach(card => card.remove());
  for (const roll of rolls) {
    const card = element('article','');
    card.dataset.local = '';
    card.id = 'eigene-rolle-' + roll.id;
    const label = element('span',roll.farbe);
    label.className = 'label';
    const specs = element('dl','');
    for (const [field,title] of Object.entries(labels)) {
      const item = element('div','');
      item.append(element('dt',title),element('dd',roll[field] || 'Nicht angegeben'));
      specs.append(item);
    }
    const edit = element('button','Bearbeiten');
    edit.onclick = () => {
      editReturnRoute = location.hash.slice(1) === 'filament-bestand' ? 'bestand/'+card.id : location.hash.slice(1);
      editing = roll.id;
      showCapture('new');
      const current = rolls.find(item=>item.id===editing);
      for (const field of form.querySelectorAll('[name]')) field.value = current?.[field.name] ?? '';
      colorPicker.open = false;
      updateColorPalette();
      location.hash = 'filament-anlegen';
      filter();
      reset.hidden = false;
      status.textContent = '';
      updateCardSave();
      form.elements.material.focus();
    };
    const openCard = element('a','Filamentkarte öffnen');
    openCard.className = 'open-roll';
    openCard.href = '#bestand/'+card.id;
    card.append(label,element('h2',roll.material),ownManufacturer(specs,roll.produktseite),edit,openCard);
    prepareCard(card,roll.farbe,roll);
    addLocalQr(card,roll,true);
    addLocalQr(card,roll);
    cards.append(card);
  }
  updateFilterOptions();
  filter();
}
const colorDraftKey = 'filament-farbentwurf';
function readColorDraft() {
  try { return localStorage.getItem(colorDraftKey) ?? ''; } catch { return ''; }
}
const colorInput = form.elements.farbe;
const shadeInput = form.elements.farbton;
const shadePicker = document.querySelector('#shade-picker');
shadePicker.oninput = () => {
  shadeInput.value = shadePicker.value;
  shadeInput.dispatchEvent(new Event('input',{bubbles:true}));
};
for (const type of materialTypes) document.querySelector('#material-types').append(new Option(type,type));
for (const family of colorFamilies) form.elements.farbfamilie.add(new Option(family,family));
const colorPicker = form.querySelector('.color-picker');
const palette = colorPicker.querySelector('.color-palette');
const colorSample = colorPicker.querySelector('.color-preview-sample');
const colorName = colorPicker.querySelector('.color-preview-name');
function updateColorPalette() {
  const name = colorInput.value.trim();
  const current = name.toLocaleLowerCase('de');
  const preset = Object.keys(colors).find(option=>option.toLocaleLowerCase('de')===current);
  colorName.textContent = name || 'Keine Farbe gewählt';
  const shade = validColor(shadeInput.value) ? shadeInput.value : colors[preset];
  if (shade) shadePicker.value = /^#[0-9a-f]{3}$/i.test(shade) ? '#'+[...shade.slice(1)].map(char=>char.repeat(2)).join('') : shade;
  else shadePicker.value = '#808080';
  colorSample.hidden = Boolean(name && !shade);
  if (shade) colorSample.style.setProperty('--preview-color',shade);
  else colorSample.style.removeProperty('--preview-color');
  for (const button of palette.children) {
    button.setAttribute('aria-pressed',String(button.textContent===preset));
  }
}
for (const [name,hex] of Object.entries(colors)) {
  const button = element('button','');
  button.type = 'button';
  const circle = element('span','');
  circle.className = 'swatch';
  circle.style.setProperty('--swatch',hex);
  circle.setAttribute('aria-hidden','true');
  button.append(circle,name);
  button.onclick = () => {
    saveSelectedColor(name);
  };
  palette.append(button);
}
colorInput.addEventListener('input',updateColorPalette);
shadeInput.addEventListener('input',updateColorPalette);
shadeInput.addEventListener('invalid',()=>{ colorPicker.open = true; });
colorInput.addEventListener('invalid',()=>{ colorPicker.open = true; });
colorInput.value = readColorDraft();
updateColorPalette();
const cardSave = document.querySelector('#card-save');
const filamentEditor = form.closest('details');
const scanView = document.querySelector('#scan-view');
document.querySelector('#new-filament').onclick = () => { clearEditor(); showCapture('menu'); status.textContent = ''; };
function updateCardSave() {
  const savedCard = rolls.find(roll=>roll.id===editing);
  const changed = !savedCard || [...form.querySelectorAll('[name]')].some(input=>input.value!==(savedCard[input.name] ?? ''));
  cardSave.hidden = cardSave.disabled = !changed;
  cardSave.textContent = savedCard ? 'Änderung speichern' : batchLabel(createBatch.quantity.valueAsNumber || 1,'speichern');
}
form.addEventListener('input',updateCardSave);
form.addEventListener('change',updateCardSave);
function createBatchFields() {
  const fields = element('fieldset','');
  fields.className = 'fields capture-batch';
  fields.append(element('legend','Rollen'));
  function addField(title,control) {
    const label = element('label',title);
    label.append(control);
    fields.append(label);
  }
  const quantity = element('input','');
  quantity.type = 'number';
  quantity.min = '1';
  quantity.max = '100';
  quantity.step = '1';
  quantity.defaultValue = '1';
  quantity.required = true;
  quantity.inputMode = 'numeric';
  addField('Anzahl der Rollen',quantity);
  const locationSelect = element('select','');
  addField('Lagerort (optional)',locationSelect);
  const packaging = element('select','');
  packaging.add(new Option('Unbekannt','unknown'));
  packaging.add(new Option('Originalverpackt','sealed'));
  packaging.add(new Option('Angebrochen','opened'));
  addField('Verpackungsstatus',packaging);
  function refreshLocations() {
    const selected = locationSelect.value;
    locationSelect.replaceChildren(new Option('Nicht angegeben',''),...readLocations().map(place=>new Option(place.name,place.id)));
    if ([...locationSelect.options].some(option=>option.value===selected)) locationSelect.value = selected;
  }
  refreshLocations();
  return {fields,quantity,locationSelect,packaging,refreshLocations};
}
function makeBatch(batch) {
  const count = batch.quantity.valueAsNumber;
  const locationId = batch.locationSelect.value;
  if (!Number.isInteger(count) || count<1 || count>100 || (locationId && !readLocations().some(place=>place.id===locationId))) return null;
  return Array.from({length:count},()=>({id:crypto.randomUUID(),weight:'',packaging:batch.packaging.value,locationId}));
}
const captureActions = element('div','');
captureActions.className = 'capture-actions';
const existingButton = element('button','Rollen zu vorhandenem Filament hinzufügen');
const createButton = element('button','Neues Filament anlegen');
existingButton.type = createButton.type = 'button';
captureActions.append(existingButton,createButton);
const batchForm = element('form','');
const query = element('input','');
query.type = 'search';
query.placeholder = 'Name, Material oder Farbe';
const queryLabel = element('label','Vorhandenes Filament suchen');
queryLabel.append(query);
const results = element('div','');
results.className = 'capture-results';
const existingBatch = createBatchFields();
const createBatch = createBatchFields();
const batchSubmit = element('button','Rolle hinzufügen');
const batchStatus = element('p','');
batchStatus.setAttribute('role','status');
batchForm.append(queryLabel,results,existingBatch.fields,batchSubmit,batchStatus);
const captureDone = element('section','');
captureDone.setAttribute('aria-live','polite');
filamentEditor.insertBefore(captureActions,form);
filamentEditor.insertBefore(batchForm,form);
filamentEditor.insertBefore(captureDone,form);
cardSave.before(createBatch.fields);
let captureMode = 'menu';
let selectedCard = '';
function batchLabel(count,verb) {
  return count===1 ? '1 Rolle '+verb : count+' Rollen '+verb;
}
function updateBatchSubmit() {
  batchSubmit.textContent = batchLabel(existingBatch.quantity.valueAsNumber || 1,'hinzufügen');
  batchSubmit.disabled = !selectedCard || !existingBatch.quantity.validity.valid;
}
function renderCaptureMatches() {
  const terms = normalizeSearch(query.value).split(' ').filter(Boolean);
  const matches = [...cards.querySelectorAll('article[id]')].filter(card=>{
    const text = normalizeSearch([card.querySelector('h2').textContent,card.dataset.material,card.dataset.color].join(' '));
    return terms.every(term=>text.includes(term));
  });
  if (!matches.some(card=>card.id===selectedCard)) selectedCard = '';
  results.replaceChildren(...matches.map(card=>{
    const button = element('button',card.querySelector('h2').textContent+' · '+card.dataset.color);
    button.type = 'button';
    button.setAttribute('aria-pressed',String(card.id===selectedCard));
    button.onclick = () => {
      selectedCard = card.id;
      for (const option of results.children) option.setAttribute('aria-pressed',String(option===button));
      batchStatus.textContent = '';
      updateBatchSubmit();
    };
    return button;
  }));
  if (!matches.length) results.append(element('p','Keine passende Filamentkarte gefunden.'));
  updateBatchSubmit();
}
function showCapture(mode) {
  captureMode = mode;
  captureActions.hidden = Boolean(editing) || mode==='done';
  existingButton.setAttribute('aria-pressed',String(mode==='existing'));
  createButton.setAttribute('aria-pressed',String(mode==='new'));
  form.hidden = !editing && mode!=='new';
  batchForm.hidden = Boolean(editing) || mode!=='existing';
  captureDone.hidden = mode!=='done';
  createBatch.fields.hidden = createBatch.fields.disabled = Boolean(editing);
  if (mode==='existing') {
    existingBatch.refreshLocations();
    renderCaptureMatches();
  }
  if (mode==='new') {
    createBatch.refreshLocations();
    updateCardSave();
  }
}
function finishCapture(cardId,count) {
  const link = element('a','Zur Filamentkarte');
  link.href = '#bestand/'+cardId;
  const more = element('button','Weitere Rollen erfassen');
  more.type = 'button';
  more.onclick = () => { showCapture('menu'); existingButton.focus(); };
  const message = element('p',batchLabel(count,'hinzugefügt')+'.');
  message.tabIndex = -1;
  captureDone.replaceChildren(message,link,element('br',''),more);
  showCapture('done');
  message.focus();
}
existingButton.onclick = () => { showCapture('existing'); query.focus(); };
createButton.onclick = () => { showCapture('new'); form.elements.material.focus(); };
query.oninput = renderCaptureMatches;
existingBatch.quantity.oninput = updateBatchSubmit;
batchForm.onsubmit = event => {
  event.preventDefault();
  const card = document.getElementById(selectedCard);
  const batch = makeBatch(existingBatch);
  if (!card || card.parentElement!==cards || !batch) {
    batchStatus.textContent = 'Prüfe Filamentkarte, Anzahl und Lagerort.';
    return;
  }
  try { localStorage.setItem('filament-bestand:'+card.id,JSON.stringify([...stockForCard(card.id),...batch])); }
  catch { batchStatus.textContent = 'Die Rollen konnten nicht gespeichert werden.'; return; }
  card.dispatchEvent(new Event('stock-batch-added'));
  batchForm.reset();
  selectedCard = '';
  batchStatus.textContent = '';
  finishCapture(card.id,batch.length);
};
showCapture('menu');
form.elements.produktseite.addEventListener('invalid',()=>{
  const extra = form.querySelector('.capture-extra');
  if (extra) extra.open = true;
});

function findDuplicateCard(material,color) {
  const normalize = value => value.normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
  return [...cards.children].find(card => card.id !== 'eigene-rolle-' + editing && normalize(card.querySelector('h2').textContent) === normalize(material) && normalize(card.dataset.color) === normalize(color));
}
function saveSelectedColor(name) {
  const saved = rolls.find(roll=>roll.id===editing);
  if (editing && !saved) {
    status.textContent = 'Die Filamentkarte ist nicht mehr vorhanden.';
    return;
  }
  if (saved && findDuplicateCard(saved.material,name)) {
    status.textContent = 'Für dieses Filament gibt es bereits eine Karte in dieser Farbe.';
    return;
  }
  const changed = saved && (saved.farbe!==name || saved.farbton || saved.farbfamilie);
  const next = saved ? rolls.map(roll=>roll.id===saved.id ? {...roll,farbe:name,farbton:'',farbfamilie:''} : roll) : rolls;
  try {
    if (!saved) localStorage.setItem(colorDraftKey,name);
    else if (changed) localStorage.setItem(key,JSON.stringify(next));
  } catch {
    status.textContent = 'Die Farbe konnte in diesem Browser nicht gespeichert werden.';
    return;
  }
  if (changed) {
    rolls = next;
    const card = document.getElementById('eigene-rolle-'+saved.id);
    if (card) updateLocalCardColor(card,next.find(roll=>roll.id===saved.id));
    else render();
  }
  colorInput.value = name;
  shadeInput.value = '';
  form.elements.farbfamilie.value = '';
  updateColorPalette();
  updateCardSave();
  status.textContent = saved ? 'Farbe gespeichert.' : 'Farbe für die neue Filamentkarte vorgemerkt.';
}
function clearEditor() {
  editing = null;
  editReturnRoute = '';
  form.reset();
  colorInput.value = readColorDraft();
  colorPicker.open = false;
  updateColorPalette();
  reset.hidden = true;
  updateCardSave();
}
reset.onclick = () => {
  const returnRoute = editReturnRoute;
  clearEditor();
  status.textContent = '';
  if (returnRoute) location.hash = returnRoute;
  else filter();
};
form.onsubmit = event => {
  event.preventDefault();
  if (cardSave.disabled) return;
  const fields = Object.fromEntries([...new FormData(form)].map(([field,value]) => [field,value.trim()]));
  if (!editing && !fields.materialart) { status.textContent = 'Bitte eine Materialart angeben.'; form.elements.materialart.focus(); return; }
  if (!fields.material || !fields.farbe) { status.textContent = 'Bitte Material und Farbe eintragen.'; return; }
  if (fields.produktseite && !productPage(fields.produktseite)) { status.textContent = 'Gib eine gültige Produktadresse mit https:// oder http:// ein.'; return; }
  const duplicate = findDuplicateCard(fields.material,fields.farbe);
  if (duplicate) {
    const show = element('button','Rollen zur vorhandenen Karte hinzufügen');
    show.type = 'button';
    show.onclick = () => {
      selectedCard = duplicate.id;
      query.value = duplicate.querySelector('h2').textContent;
      existingBatch.quantity.value = createBatch.quantity.value;
      showCapture('existing');
      existingBatch.locationSelect.value = createBatch.locationSelect.value;
      existingBatch.packaging.value = createBatch.packaging.value;
      existingBatch.quantity.focus();
    };
    status.replaceChildren('Für dieses Filament gibt es bereits eine Karte. ',show);
    return;
  }
  const returnRoute = editing ? editReturnRoute : '';
  const batch = editing ? null : makeBatch(createBatch);
  if (!editing && !batch) { status.textContent = 'Prüfe Anzahl und Lagerort.'; return; }
  const roll = {...fields,id:editing ?? crypto.randomUUID()};
  const cardId = 'eigene-rolle-'+roll.id;
  const next = editing ? rolls.map(item => item.id === editing ? roll : item) : [...rolls,roll];
  const stockKey = 'filament-bestand:'+cardId;
  let wroteStock = false;
  try {
    if (batch) {
      localStorage.setItem(stockKey,JSON.stringify(batch));
      wroteStock = true;
    }
    localStorage.setItem(key,JSON.stringify(next));
  } catch {
    if (wroteStock) { try { localStorage.removeItem(stockKey); } catch {} }
    status.textContent = 'Speichern in diesem Browser fehlgeschlagen.';
    return;
  }
  rolls = next;
  if (!editing) {
    try { localStorage.removeItem(colorDraftKey); } catch {}
  }
  clearEditor();
  search.value = '';
  render();
  if (batch) finishCapture(cardId,batch.length);
  else location.hash = returnRoute || 'bestand/'+cardId;
  status.textContent = 'Gespeichert';
};

const backupFile = document.querySelector('#backup-file');
const backupStatus = document.querySelector('#backup-status');
const backupPreview = document.querySelector('#backup-preview');
const backupConflict = document.querySelector('#backup-conflict');
let incomingBackup = null;
const backupPrefixes = ['filament-x2d:','filament-bestand:','filament-spulengewicht:'];
const localCardPattern = /^eigene-rolle-[a-f0-9-]{36}$/i;
function personalKey(name) {
  if (name === key || name === locationKey || name === locationOrderKey || name === dryingIntervalKey || name === printerKey || name === nozzleVariantKey) return true;
  const printerProfile = name.match(/^filament-druckprofil:(?:x2d|[a-f0-9-]{36}):(?:[0-7]|[a-f0-9-]{36}):(.+)$/i);
  if (printerProfile) return personalKey('filament-x2d:'+printerProfile[1]);
  const prefix = backupPrefixes.find(value=>name.startsWith(value));
  if (!prefix) return false;
  const cardId = name.slice(prefix.length).replace(prefix==='filament-x2d:' ? /:secondary$/ : /$/,'');
  return localCardPattern.test(cardId) || [...cards.querySelectorAll('article[id]:not([data-local])')].some(card=>card.id===cardId);
}
function validateBackup(data) {
  if (data?.version!==1 || !data.records || typeof data.records!=='object' || Array.isArray(data.records)) throw Error();
  const isText = value => typeof value==='string';
  const decimal = value => isText(value) && (value==='' || (value.trim()!=='' && Number.isFinite(Number(value)) && Number(value)>=0));
  for (const [name,raw] of Object.entries(data.records)) {
    if (!personalKey(name) || !isText(raw)) throw Error();
    if (name.startsWith('filament-spulengewicht:')) { if (!decimal(raw)) throw Error(); continue; }
    const value = JSON.parse(raw);
    if (name===dryingIntervalKey) {
      if (!value || typeof value!=='object' || Array.isArray(value) || Object.values(value).some(days=>!validDryingInterval(days))) throw Error();
    } else if (name===locationOrderKey) {
      if (!Array.isArray(value) || value.some(id=>!isText(id) || !id) || new Set(value).size!==value.length) throw Error();
    } else if (name===nozzleVariantKey) {
      if (!Array.isArray(value) || value.some(item=>!item || !/^[a-f0-9-]{36}$/i.test(item.id) || !/^(?:x2d|[a-f0-9-]{36})$/i.test(item.printerId) || !Number.isInteger(item.position) || item.position<0 || item.position>7 || !item.diameter || !validNozzle(item.diameter)) || new Set(value.map(item=>item.id)).size!==value.length) throw Error();
    } else if (name===printerKey) {
      if (!Array.isArray(value) || value.some(item=>!item || !/^[a-f0-9-]{36}$/i.test(item.id) || !isText(item.name) || !item.name.trim() || item.name.length>80 || !Array.isArray(item.diameters) || item.diameters.length<1 || item.diameters.length>8 || item.diameters.some(value=>!validNozzle(value))) || new Set(value.map(item=>item.id)).size!==value.length) throw Error();
    } else if (name===locationKey) {
      if (!Array.isArray(value) || value.some(item=>!item || !isText(item.id) || !isText(item.name) || !item.name.trim() || item.name.length>60) || new Set(value.map(item=>item.id)).size!==value.length) throw Error();
    } else if (name===key) {
      if (!Array.isArray(value) || value.some(item=>!item || !localCardPattern.test('eigene-rolle-'+item.id) || !isText(item.material) || !item.material.trim() || !isText(item.farbe) || !item.farbe.trim() || Object.values(item).some(field=>!isText(field)))) throw Error();
      if (new Set(value.map(item=>item.id)).size!==value.length) throw Error();
    } else if (name.startsWith('filament-bestand:')) {
      if (!Array.isArray(value) || value.some(item=>!item || !isText(item.id) || !['unknown','opened','sealed'].includes(item.packaging) || !decimal(item.weight) || (item.locationId!==undefined && !isText(item.locationId)) || !decimal(item.gross??'') || !decimal(item.tare??'') || (item.dryingDue!==undefined && typeof item.dryingDue!=='boolean') || (item.drying!==undefined && (!Array.isArray(item.drying) || item.drying.some(session=>!validDryingSession(session)))) || (item.gross && (!item.tare && item.tare!=='0' || Number(item.gross)<Number(item.tare))))) throw Error();
      if (new Set(value.map(item=>item.id)).size!==value.length) throw Error();
    } else if (!value || typeof value!=='object' || Array.isArray(value) || Object.values(value).some(field=>!isText(field))) throw Error();
  }
  return data.records;
}
function backupPlan(records) {
  const changes = [];
  for (const [name,value] of Object.entries(records)) {
    const before = localStorage.getItem(name);
    if (name!==key && name!==locationKey && name!==printerKey && name!==nozzleVariantKey) {
      if (before!==value) changes.push({name,before,value,conflict:before!==null});
      continue;
    }
    const current = JSON.parse(before??'[]');
    const imported = JSON.parse(value);
    const merged = new Map(current.map(item=>[item.id,item]));
    for (const item of imported) {
      const previous = merged.get(item.id);
      if (JSON.stringify(previous)!==JSON.stringify(item)) changes.push({name,id:item.id,value:item,conflict:previous!==undefined});
    }
  }
  return changes;
}
document.querySelector('#backup-export').onclick = () => {
  try {
    const records = Object.fromEntries(Object.keys(localStorage).filter(personalKey).map(name=>[name,localStorage.getItem(name)]));
    const url = URL.createObjectURL(new Blob([JSON.stringify({version:1,records},null,2)],{type:'application/json'}));
    const download = element('a','');
    download.href = url;
    download.download = 'Filament-Bestand-Sicherung.json';
    download.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    backupStatus.textContent = 'Sicherungsdatei erstellt.';
  } catch { backupStatus.textContent = 'Die Sicherung konnte nicht erstellt werden.'; }
};
backupFile.onchange = async () => {
  incomingBackup = null;
  backupPreview.hidden = true;
  const file = backupFile.files[0];
  if (!file) return;
  try {
    if (file.size > 2000000) throw Error();
    const parsed = validateBackup(JSON.parse(await file.text()));
    if (backupFile.files[0]!==file) return;
    const plan = backupPlan(parsed);
    incomingBackup = parsed;
    const conflicts = plan.filter(item=>item.conflict).length;
    backupStatus.textContent = plan.length ? 'Vorschau: '+(plan.length-conflicts)+' neue Einträge, '+conflicts+' Konflikte mit vorhandenen Einträgen.' : 'Die Sicherung enthält keine Änderungen.';
    backupConflict.value = 'keep';
    backupPreview.hidden = !plan.length;
  } catch { backupStatus.textContent = 'Die Datei ist keine gültige Sicherung für Filament Bestand.'; }
};
document.querySelector('#backup-import').onclick = () => {
  if (!incomingBackup) return;
  const written = [];
  try {
    const plan = backupPlan(incomingBackup).filter(item=>!item.conflict || backupConflict.value==='replace');
    const writes = plan.filter(item=>item.name!==key && item.name!==locationKey && item.name!==printerKey && item.name!==nozzleVariantKey);
    for (const name of [key,locationKey,printerKey,nozzleVariantKey]) {
      const importedItems = plan.filter(item=>item.name===name);
      if (!importedItems.length) continue;
      const before = localStorage.getItem(name);
      const merged = new Map(JSON.parse(before??'[]').map(item=>[item.id,item]));
      for (const item of importedItems) merged.set(item.id,item.value);
      writes.push({name,before,value:JSON.stringify([...merged.values()])});
    }
    for (const item of writes) {
      localStorage.setItem(item.name,item.value);
      written.push(item);
    }
    backupPreview.hidden = true;
    incomingBackup = null;
    backupStatus.textContent = 'Sicherung übernommen. Die Seite wird neu geladen.';
    location.reload();
  } catch {
    for (const item of written.reverse()) {
      try { if (item.before===null) localStorage.removeItem(item.name); else localStorage.setItem(item.name,item.before); } catch {}
    }
    backupStatus.textContent = 'Die Sicherung konnte nicht vollständig übernommen werden.';
  }
};

const scanOpen = document.querySelector('#scan-open');
const scanPanel = document.querySelector('#filament-scanner');
const scanVideo = document.querySelector('#scan-video');
const scanPhoto = document.querySelector('#scan-photo');
const scanStatus = document.querySelector('#scan-status');
const scanCanvas = element('canvas','');
const scanContext = scanCanvas.getContext('2d',{willReadFrequently:true});
let scannerLibrary, scanStream, scanTimer;
let scanSession = 0;
function loadScanner() {
  if (!scannerLibrary) scannerLibrary = new Promise((resolve,reject) => {
    const script = element('script','');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.integrity = 'sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  }).catch(error=>{ scannerLibrary = null; throw error; });
  return scannerLibrary;
}
function closeScanner() {
  scanSession++;
  clearTimeout(scanTimer);
  scanStream?.getTracks().forEach(track=>track.stop());
  scanStream = null;
  scanVideo.srcObject = null;
  scanVideo.hidden = true;
  scanPhoto.value = '';
  scanPanel.hidden = true;
  scanOpen.setAttribute('aria-expanded','false');
}
function readQr(image,width,height,limit) {
  const scale = Math.min(1,limit/Math.max(width,height));
  scanCanvas.width = Math.max(1,Math.round(width*scale));
  scanCanvas.height = Math.max(1,Math.round(height*scale));
  scanContext.drawImage(image,0,0,scanCanvas.width,scanCanvas.height);
  const pixels = scanContext.getImageData(0,0,scanCanvas.width,scanCanvas.height);
  return jsQR(pixels.data,pixels.width,pixels.height)?.data;
}
function openScannedFilament(code) {
  let address;
  try { address = new URL(code); } catch { return false; }
  const route = address.hash.slice(1);
  const basePath = location.pathname.replace(/index\.html$/,'');
  if (address.origin!==location.origin || address.pathname.replace(/index\.html$/,'')!==basePath || !route) return false;
  if (!route.startsWith(sharedPrefix) && !/^eigene-rolle-[a-f0-9-]{36}$/i.test(route) && document.getElementById(route)?.parentElement!==cards) return false;
  closeScanner();
  if (location.hash===address.hash) filter();
  else location.hash = address.hash;
  window.scrollTo(0,0);
  return true;
}
scanOpen.onclick = async () => {
  if (!scanPanel.hidden) { closeScanner(); return; }
  const session = ++scanSession;
  scanPanel.hidden = false;
  scanOpen.setAttribute('aria-expanded','true');
  if (!navigator.mediaDevices?.getUserMedia) {
    scanStatus.textContent = 'Live-Kamera ist hier nicht verfügbar. Wähle ein QR-Foto oder öffne das Filamentlager in Safari oder Chrome.';
    return;
  }
  scanStatus.textContent = 'Warte auf Kamerazugriff …';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    if (session!==scanSession) { stream.getTracks().forEach(track=>track.stop()); return; }
    scanStream = stream;
    await loadScanner();
    if (session!==scanSession) return;
    scanVideo.srcObject = stream;
    scanVideo.hidden = false;
    await scanVideo.play();
    if (session!==scanSession) return;
    scanStatus.textContent = 'Halte den QR-Code gut sichtbar vor die Kamera.';
    function scanFrame() {
      if (session!==scanSession) return;
      if (scanVideo.videoWidth && scanVideo.readyState>=2) {
        const code = readQr(scanVideo,scanVideo.videoWidth,scanVideo.videoHeight,850);
        if (code && openScannedFilament(code)) return;
        if (code) scanStatus.textContent = 'Dieser QR-Code gehört nicht zum Filamentlager.';
      }
      scanTimer = setTimeout(scanFrame,180);
    }
    scanFrame();
  } catch {
    if (session!==scanSession) return;
    scanStream?.getTracks().forEach(track=>track.stop());
    scanStream = null;
    scanVideo.srcObject = null;
    scanVideo.hidden = true;
    scanStatus.textContent = 'Die Kamera konnte nicht gestartet werden. Prüfe die Kamerafreigabe oder wähle ein QR-Foto.';
  }
};
scanPhoto.onchange = async () => {
  const file = scanPhoto.files[0];
  if (!file) return;
  const session = scanSession;
  const url = URL.createObjectURL(file);
  scanStatus.textContent = 'QR-Foto wird gelesen …';
  try {
    const image = new Image();
    image.src = url;
    await Promise.all([loadScanner(),image.decode()]);
    if (session!==scanSession) return;
    const code = readQr(image,image.naturalWidth,image.naturalHeight,1600);
    if (code && openScannedFilament(code)) return;
    scanStatus.textContent = code ? 'Dieser QR-Code gehört nicht zum Filamentlager.' : 'Auf diesem Foto wurde kein QR-Code erkannt.';
  } catch {
    if (session===scanSession) scanStatus.textContent = 'Das Foto konnte nicht gelesen werden. Wähle ein anderes QR-Foto.';
  } finally {
    URL.revokeObjectURL(url);
    if (session===scanSession) scanPhoto.value = '';
  }
};
document.querySelector('#menu-scan').onclick = event => {
  event.preventDefault();
  history.pushState(null,'','#filament-scannen');
  filter();
  scanOpen.click();
};
document.querySelector('#scan-close').onclick = () => { closeScanner(); scanOpen.focus(); };
window.addEventListener('hashchange',closeScanner);
window.addEventListener('pagehide',closeScanner);

const printerView = document.querySelector('#meine-drucker');
const printerList = document.querySelector('#printer-list');
const printerAdd = document.querySelector('#printer-add');
const printerForm = document.querySelector('#printer-form');
const printerStatus = document.querySelector('#printer-status');
const nozzleFields = document.querySelector('#printer-nozzles');
const countSelect = printerForm.elements.count;
for (let count=1;count<=8;count++) countSelect.add(new Option(String(count),String(count)));
function renderPrinters() {
  printerList.replaceChildren();
  for (const printer of readPrinters()) {
    const entry = element('article','');
    entry.append(element('h3',printer.name));
    const list = element('ul','');
    for (const item of printerNozzles(printer)) list.append(element('li',nozzleName(printer,item.position)+(item.diameter?' · '+item.diameter+' mm':'')));
    entry.append(list);
    const edit = element('details','');
    edit.append(element('summary','Drucker bearbeiten'));
    const form = element('form','');
    const fields = element('div','');
    fields.className = 'fields';
    const positionLabel = element('label','Düsenposition');
    const position = element('select','');
    printer.diameters.forEach((_,index)=>position.add(new Option(nozzleName(printer,index),String(index))));
    positionLabel.append(position);
    const diameterLabel = element('label','Neuer Durchmesser in mm');
    const diameter = element('input','');
    diameter.inputMode = 'decimal';
    diameter.placeholder = '0,6';
    diameter.required = true;
    diameter.maxLength = 8;
    diameterLabel.append(diameter);
    fields.append(positionLabel,diameterLabel);
    const save = element('button','Düsenvariante hinzufügen');
    const feedback = element('p','');
    feedback.setAttribute('role','status');
    form.append(fields,save,feedback);
    form.onsubmit = event => {
      event.preventDefault();
      const value = diameter.value.trim();
      const index = Number(position.value);
      if (!value || !validNozzle(value)) { feedback.textContent = 'Gib einen gültigen Durchmesser ein.'; return; }
      const number = Number(value.replace(',','.'));
      const duplicate = printerNozzles(printer).some(item=>item.position===index && Number(item.diameter.replace(',','.'))===number);
      if (duplicate) { feedback.textContent = 'Diesen Durchmesser gibt es für diese Position bereits.'; return; }
      const added = {id:crypto.randomUUID(),printerId:printer.id,position:index,diameter:String(number).replace('.',',')};
      try { localStorage.setItem(nozzleVariantKey,JSON.stringify([...readNozzleVariants(),added])); }
      catch { feedback.textContent = 'Die Düsenvariante konnte nicht gespeichert werden.'; return; }
      for (const card of cards.children) card.dispatchEvent(new Event('printers-changed'));
      renderPrinters();
      printerStatus.textContent = 'Düsenvariante gespeichert.';
    };
    edit.append(form);
    entry.append(edit);

    printerList.append(entry);
  }
}
function renderNozzleFields() {
  const old = [...nozzleFields.querySelectorAll('input')].map(input=>input.value);
  nozzleFields.replaceChildren();
  for (let index=0;index<Number(countSelect.value);index++) {
    const label = element('label','Durchmesser Düse '+(index+1)+' in mm (optional)');
    const input = element('input','');
    input.inputMode = 'decimal';
    input.maxLength = 8;
    input.placeholder = '0,4';
    input.value = old[index] ?? '';
    label.append(input);
    nozzleFields.append(label);
  }
}
countSelect.onchange = renderNozzleFields;
printerAdd.onclick = () => {
  printerForm.hidden = !printerForm.hidden;
  printerAdd.setAttribute('aria-expanded',String(!printerForm.hidden));
  if (!printerForm.hidden) printerForm.elements.name.focus();
};
function validNozzle(value) {
  return typeof value==='string' && (value==='' || (/^\d+(?:[,.]\d+)?$/.test(value) && value.length<=8 && Number(value.replace(',','.'))>0));
}
printerForm.onsubmit = event => {
  event.preventDefault();
  const name = printerForm.elements.name.value.trim();
  const diameters = [...nozzleFields.querySelectorAll('input')].map(input=>input.value.trim());
  if (!name || diameters.some(value=>!validNozzle(value))) { printerStatus.textContent = 'Gib einen Druckernamen und gültige Düsendurchmesser ein.'; return; }
  const printers = readPrinters();
  if (printers.some(printer=>printer.name.toLocaleLowerCase('de')===name.toLocaleLowerCase('de'))) { printerStatus.textContent = 'Diesen Druckernamen gibt es bereits.'; return; }
  const added = {id:crypto.randomUUID(),name,diameters:diameters.map(value=>value.replace('.',','))};
  try { localStorage.setItem(printerKey,JSON.stringify([...printers.filter(printer=>printer.id!=='x2d'),added])); }
  catch { printerStatus.textContent = 'Der Drucker konnte nicht gespeichert werden.'; return; }
  for (const card of cards.children) card.dispatchEvent(new Event('printers-changed'));
  printerForm.reset();
  nozzleFields.replaceChildren();
  renderNozzleFields();
  printerForm.hidden = true;
  printerAdd.setAttribute('aria-expanded','false');
  renderPrinters();
  printerStatus.textContent = 'Drucker gespeichert.';
};
renderNozzleFields();

const dryingStates = {
  due:{label:'Fällig',rank:0},
  soon:{label:'Bald fällig',rank:1},
  planned:{label:'Eingeplant',rank:2},
  open:{label:'Offen',rank:3}
};
const dayInMs = 86400000;
function validDryingInterval(days) {
  return Number.isInteger(days) && days>=1 && days<=3650;
}
function readDryingIntervals() {
  try {
    const value = JSON.parse(localStorage.getItem(dryingIntervalKey));
    if (value && typeof value==='object' && !Array.isArray(value)) return value;
  } catch {}
  return {};
}
function dryingSchedule(roll,interval,today = new Date()) {
  const last = (Array.isArray(roll.drying) ? roll.drying : []).filter(validDryingSession)
    .reduce((latest,session)=>session.date>latest ? session.date : latest,'');
  const currentDay = Date.UTC(today.getFullYear(),today.getMonth(),today.getDate());
  const due = last && validDryingInterval(interval) ? Date.parse(last+'T00:00:00Z') + interval*dayInMs : null;
  const days = due===null ? null : (due-currentDay)/dayInMs;
  const state = roll.dryingDue || (days!==null && days<=0) ? 'due' : days===null ? 'open' : days<=3 ? 'soon' : 'planned';
  return {state,last,due};
}
function renderDryingDashboard() {
  const intervals = readDryingIntervals();
  const places = new Map(readLocations().map(place=>[place.id,place.name]));
  const items = [];
  let sealed = 0;
  for (const card of cards.querySelectorAll('article[id]')) {
    for (const [index,roll] of stockForCard(card.id).entries()) {
      if (roll.packaging==='sealed') {
        sealed++;
        if (!dryingSealed.checked) continue;
      }
      const interval = Object.hasOwn(intervals,card.id) && validDryingInterval(intervals[card.id]) ? intervals[card.id] : null;
      const title = card.querySelector('h2').textContent+' · '+card.dataset.color;
      items.push({card,roll,index,interval,title,...dryingSchedule(roll,interval)});
    }
  }
  items.sort((a,b)=>dryingStates[a.state].rank-dryingStates[b.state].rank ||
    (a.due ?? -Infinity)-(b.due ?? -Infinity) || a.title.localeCompare(b.title,'de') || a.index-b.index);
  const dateLabel = date=>date.split('-').reverse().join('.');
  function report(message) { dryingStatus.textContent = message; }
  function intervalEditor(item) {
    const settings = element('details','');
    settings.append(element('summary',item.interval ? 'Intervall: '+item.interval+' Tage' : 'Intervall einstellen'));
    const editor = element('form','');
    editor.append(element('p','Das Intervall gilt für alle Rollen dieses Filaments. Lass das Feld leer, um es zu entfernen.'));
    const label = element('label','Trocknungsintervall (Tage)');
    const days = element('input','');
    days.type = 'number';
    days.min = '1';
    days.max = '3650';
    days.step = '1';
    days.inputMode = 'numeric';
    days.value = item.interval ?? '';
    label.append(days);
    editor.append(label,element('button','Intervall speichern'));
    editor.onsubmit = event => {
      event.preventDefault();
      const value = days.valueAsNumber;
      if (days.value && !validDryingInterval(value)) return;
      const next = readDryingIntervals();
      if (days.value) next[item.card.id] = value;
      else delete next[item.card.id];
      try { localStorage.setItem(dryingIntervalKey,JSON.stringify(next)); }
      catch { report('Das Intervall konnte nicht gespeichert werden.'); return; }
      renderDryingDashboard();
      report(days.value ? 'Intervall gespeichert.' : 'Intervall entfernt.');
    };
    settings.append(editor);
    return settings;
  }
  const entries = items.map(item=>{
    const {card,roll,index,title,state,last,due} = item;
    const view = element('article','');
    view.className = 'drying-dashboard-card';
    const heading = element('h3','');
    const link = element('a',title);
    link.href = '#trocknung/'+card.id;
    heading.append(link);
    const signal = element('span',dryingStates[state].label);
    signal.className = 'drying-state';
    signal.dataset.state = state;
    view.append(heading,element('p','Rolle '+(index+1)+' · '+(places.get(roll.locationId) ?? 'Lagerort nicht angegeben')),signal);
    view.append(element('p',last ? 'Zuletzt getrocknet: '+dateLabel(last) : 'Letzte Trocknung unbekannt'));
    if (due!==null) view.append(element('p','Geplanter Termin: '+dateLabel(new Date(due).toISOString().slice(0,10))));
    if (roll.dryingDue) view.append(element('p','Manuell als fällig markiert.'));
    if (roll.packaging==='sealed') view.append(element('p','Originalverpackt'));
    const recommendations = [...card.querySelectorAll('.drying-quick > ul > li')];
    if (recommendations.length===1) view.append(element('p','Empfehlung: '+recommendations[0].textContent));
    else if (recommendations.length>1) {
      const details = element('details','');
      const list = element('ul','');
      for (const recommendation of recommendations) list.append(element('li',recommendation.textContent));
      details.append(element('summary','Trocknungsempfehlungen'),list);
      view.append(details);
    } else view.append(element('p','Keine Trocknungsempfehlung hinterlegt.'));
    const history = dryingHistory(roll,session=>{
      const saved = dryingActions.get(card)?.saveDrying(roll.id,session);
      if (saved) report('Trocknung gespeichert. Die Ampel wurde aktualisiert.');
      return saved;
    });
    history.querySelector('summary').textContent = 'Trocknung erfassen';
    const actions = element('div','');
    actions.className = 'drying-actions';
    const mark = element('button',roll.dryingDue ? 'Manuelle Markierung entfernen' : 'Als fällig markieren');
    mark.type = 'button';
    mark.onclick = () => {
      const saved = dryingActions.get(card)?.markDue(roll.id,!roll.dryingDue);
      report(saved ? (roll.dryingDue ? 'Manuelle Markierung entfernt.' : 'Rolle als fällig markiert.') : 'Die Markierung konnte nicht gespeichert werden.');
    };
    actions.append(mark);
    view.append(history,intervalEditor(item),actions);
    return view;
  });
  if (!dryingSealed.checked && sealed) entries.push(element('p',sealed+(sealed===1?' originalverpackte Rolle ausgeblendet.':' originalverpackte Rollen ausgeblendet.')));
  if (!items.length) entries.unshift(element('p','Keine Rollen für diese Auswahl vorhanden.'));
  dryingRolls.replaceChildren(...entries);
}

const dryingDashboard = document.querySelector('#trocknung');
const dryingSealed = document.querySelector('#drying-show-sealed');
const dryingRolls = document.querySelector('#drying-dashboard-rolls');
const dryingStatus = document.querySelector('#drying-dashboard-status');
if (dryingSealed) dryingSealed.onchange = () => renderDryingDashboard();
search.oninput = filter;
render();
