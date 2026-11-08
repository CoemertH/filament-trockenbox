'use strict';

const projectsKey = 'filament-projekte';
const projectRoute = /^projekt\/(?:neu|[a-f0-9-]{36})$/i;
const projectWeight = value => Math.round(value * 1000) / 1000;

function readProjects() {
  return JSON.parse(localStorage.getItem(projectsKey) ?? '[]');
}

function validProjects(projects) {
  const text = value => typeof value === 'string' && value.length > 0;
  const grams = value => Number.isFinite(value) && value >= 0 && projectWeight(value) === value;
  const unique = (items, key) => new Set(items.map(key)).size === items.length;
  return Array.isArray(projects) && projects.every(project =>
    project && /^[a-f0-9-]{36}$/i.test(project.id) && text(project.name) &&
    Array.isArray(project.lines) && project.lines.length && project.lines.every(line =>
      line && text(line.cardId) && text(line.label) && grams(line.need) && line.need > 0 &&
      grams(line.reserve) && typeof line.single === 'boolean' &&
      ['required','check','none'].includes(line.dry)) &&
    Array.isArray(project.excluded) && project.excluded.every(text) &&
    (!project.closed ? project.bookings === undefined : text(project.closed) &&
      Array.isArray(project.bookings) && unique(project.bookings, row => JSON.stringify([row?.cardId,row?.rollId])) &&
      project.bookings.every(row => row && text(row.cardId) && text(row.rollId) && text(row.label) &&
        typeof row.revision === 'string' && Array.isArray(row.entries) && row.entries.length &&
        row.entries.every(entry => entry && text(entry.date) && grams(entry.grams)))))
    && unique(projects, project => project.id);
}

let projectWeightCache;
function projectBalances(projects) {
  if (projects===undefined) {
    const raw = localStorage.getItem(projectsKey);
    if (projectWeightCache?.raw === raw && projectWeightCache) return projectWeightCache.balances;
    const balances = projectBalances(JSON.parse(raw ?? '[]'));
    projectWeightCache = {raw,balances};
    return balances;
  }
  const balances = new Map();
  for (const project of projects) {
    for (const row of project.bookings ?? []) {
      const key = JSON.stringify([row.cardId,row.rollId,row.revision]);
      balances.set(key,projectWeight((balances.get(key) ?? 0) + row.entries.at(-1).grams));
    }
  }
  return balances;
}

function currentProjectRoll(cardId, roll) {
  if (roll.weight == null || String(roll.weight).trim() === '') return roll;
  const key = JSON.stringify([cardId,roll.id,roll.weightRevision ?? '']);
  const consumed = projectBalances().get(key) ?? 0;
  return consumed ? {...roll,weight:String(projectWeight(Number(roll.weight)-consumed))} : roll;
}

function nominalProjectGrams(label) {
  const match = /^([\d]+(?:[,.]\d+)?)\s*(kg|g)$/i.exec(label.trim());
  return match ? Number(match[1].replace(',','.')) * (match[2].toLowerCase()==='kg' ? 1000 : 1) : null;
}

function projectGroups(lines) {
  const groups = new Map();
  for (const line of lines) {
    const group = groups.get(line.cardId) ?? {...line,need:0,reserve:0};
    group.need = projectWeight(group.need + line.need);
    group.reserve = projectWeight(group.reserve + line.reserve);
    group.single ||= line.single;
    if (line.dry === 'required' || group.dry === 'none') group.dry = line.dry;
    groups.set(line.cardId,group);
  }
  return [...groups.values()];
}

function projectAvailability(group, rolls) {
  const recorded = rolls.filter(row=>row.kind==='recorded' && row.grams>0).sort((a,b)=>b.grams-a.grams);
  const estimates = rolls.filter(row=>row.kind==='nominal' && row.grams>0).sort((a,b)=>b.grams-a.grams);
  const unknown = rolls.some(row=>row.kind==='unknown');
  const target = projectWeight(group.need+group.reserve);
  const total = projectWeight(recorded.reduce((sum,row)=>sum+row.grams,0));
  const largest = recorded[0]?.grams ?? 0;
  const confirmed = group.single ? largest : total;
  const possible = group.single ? Math.max(largest,estimates[0]?.grams ?? 0) :
    projectWeight(total+estimates.reduce((sum,row)=>sum+row.grams,0));
  const selected = [];
  let remaining = target;
  const estimatedSingle = group.single && largest<group.need && estimates[0]?.grams>=group.need;
  for (const row of estimatedSingle ? estimates : [...recorded,...estimates]) {
    if (remaining<=0 || (group.single && selected.length)) break;
    selected.push(row);
    remaining = projectWeight(remaining-row.grams);
  }
  if (largest>=target) return {total,selected,tone:'green',label:'Reicht inklusive Reserve'};
  if (confirmed>=group.need) return {total,selected,tone:'yellow',
    label:[largest<group.need ? 'Rollenwechsel nötig' : '',confirmed<target ? 'Reserve fehlt' : '',
      selected.some(row=>row.kind==='nominal') ? 'Reserve laut Nenngewicht' : ''].filter(Boolean).join(' · ') || 'Reserve auf mehreren Rollen'};
  if (possible>=group.need || unknown) return {total,selected,tone:'yellow',
    label:possible>=group.need ? 'Menge laut Nenngewicht · vor Buchung wiegen' : 'Restgewicht prüfen · '+gramsLabel(projectWeight(group.need-confirmed))+' fehlen im erfassten Bestand'};
  return {total,selected,tone:'red',label:gramsLabel(projectWeight(group.need-confirmed))+
    (group.single ? ' fehlen auf der größten erfassten Rolle' : ' fehlen im erfassten Bestand')};
}

function projectRollKey(cardId,rollId) {
  return JSON.stringify([cardId,rollId]);
}

function projectInventory(group,excluded = []) {
  const card = document.getElementById(group.cardId);
  if (card?.parentElement !== cards) return [];
  const nominal = nominalWeight(card);
  return stockForCard(card.id).map((raw,index)=>{
    const roll = currentProjectRoll(card.id,raw);
    const kind = weightKind(roll,nominal);
    const grams = kind==='recorded' ? Number(roll.weight) : kind==='nominal' ? nominalProjectGrams(nominal) : null;
    return {roll,index,kind:grams===null ? 'unknown' : kind,grams,key:projectRollKey(card.id,roll.id)};
  }).filter(row=>!excluded.includes(row.key));
}

function projectDryingText(roll, interval, requirement) {
  const {state,last} = dryingSchedule(roll,interval);
  if (state==='due' || !last) {
    if (requirement==='required') return 'Vor dem Druck trocknen';
    return last ? 'Trocknung fällig' : 'Keine Trocknung dokumentiert';
  }
  return 'Getrocknet am '+last.split('-').reverse().join('.')+
    (state==='open' ? ' · Aktualität prüfen' : state==='soon' ? ' · Trocknung bald fällig' : '');
}

const projectPanel = document.querySelector('#project-panel');
let projectDraft;
let historyFilter = '';

function projectButton(label, action) {
  const button = element('button',label);
  button.type = 'button';
  button.onclick = action;
  return button;
}

function projectLink(label,route) {
  const link = element('a',label);
  link.href = '#'+route;
  return link;
}

function projectField(parent,label,input) {
  const field = element('label',label);
  field.append(input);
  parent.append(field);
  return input;
}

function projectGrams(parent,label,value,min = 0) {
  const input = element('input','');
  input.type = 'number';
  input.inputMode = 'decimal';
  input.min = String(min);
  input.step = '0.001';
  input.required = true;
  input.value = value ?? '';
  return projectField(parent,label,input);
}

async function changeProjects(update,status) {
  try {
    if (!navigator.locks) throw Error('Dieser Browser unterstützt keine sichere Projektbuchung.');
    await navigator.locks.request(projectsKey,()=>{
      const projects = readProjects();
      const next = update(projects);
      if (!validProjects(next)) throw Error('Bitte prüfe die Projekteingaben.');
      if (!saveRecords([[projectsKey,next]])) throw Error('Das Projekt konnte nicht gespeichert werden.');
    });
    for (const card of cards.querySelectorAll('article[id]')) card.dispatchEvent(new Event('project-stock-updated'));
    return true;
  } catch (error) {
    status.textContent = error.message;
    return false;
  }
}

function projectStockRows(project, parent, route, onChange) {
  const places = new Map(readLocations().map(place=>[place.id,place.name]));
  const intervals = readDryingIntervals();
  const others = readProjects().filter(item=>!item.closed && item.id!==project.id);
  const shared = new Set(others.flatMap(item=>projectGroups(item.lines).flatMap(group=>
    projectAvailability(group,projectInventory(group,item.excluded)).selected.map(row=>row.key))));
  for (const group of projectGroups(project.lines)) {
    const all = projectInventory(group);
    const availability = projectAvailability(group,all.filter(row=>!project.excluded.includes(row.key)));
    const section = element('section','');
    section.className = 'stock-roll-entry';
    const indicator = element('strong',availability.label);
    indicator.className = 'project-'+availability.tone;
    section.append(element('h3',group.label),indicator,element('p',
      gramsLabel(group.need)+' Bedarf · '+gramsLabel(group.reserve)+' Reserve · '+gramsLabel(availability.total)+' erfasst'));
    if (availability.selected.length) section.append(element('p',availability.selected.length+(availability.selected.length===1 ? ' Rolle vorgeschlagen' : ' Rollen vorgeschlagen')));
    const selected = new Set(availability.selected.map(row=>row.key));
    for (const {roll,index,key} of all) {
      const row = element('div','');
      const check = element('input','');
      check.type = 'checkbox';
      check.checked = !project.excluded.includes(key);
      check.onchange = () => {
        project.excluded = check.checked ? project.excluded.filter(value=>value!==key) : [...project.excluded,key];
        onChange();
      };
      projectField(row,'Rolle '+(index+1)+(selected.has(key) ? ' · vorgeschlagen' : '')+' einbeziehen',check);
      const card = document.getElementById(group.cardId);
      row.append(element('p',[weightDescription(roll,nominalWeight(card)),places.get(roll.locationId) ?? 'Ohne Lagerort',
        projectDryingText(roll,intervals[group.cardId],group.dry)].join(' · ')),
        rollActionLink(group.cardId,roll.id,route,'Wiegen','weigh'),document.createTextNode(' · '),
        rollActionLink(group.cardId,roll.id,route,'Trocknung erfassen','dry'));
      if (selected.has(key) && shared.has(key)) row.append(element('p','Auch in einem anderen offenen Projekt vorgeschlagen.'));
      section.append(row);
    }
    parent.append(section);
  }
}

function projectWizard(route) {
  const stored = readProjects().find(project=>'projekt/'+project.id===route);
  if (route!=='projekt/neu' && (!stored || stored.closed)) {
    if (stored?.closed) return projectHistoryDetail(stored);
    projectPanel.append(element('p','Dieses Projekt ist nicht verfügbar.'));
    return;
  }
  if (projectDraft?.route!==route) projectDraft = {route,step:stored ? 3 : 1,
    baseline:stored ? JSON.stringify(stored) : null,project:stored ? structuredClone(stored) : {id:crypto.randomUUID(),name:'',lines:[{dry:'check',reserve:0}],excluded:[]}};
  const {project,step,baseline} = projectDraft;
  const rerender = () => renderProjects(route);
  const form = element('form','');
  const status = element('p','');
  status.setAttribute('role','status');
  form.append(element('h2',['Material wählen','Bedarf und Trocknung','Rollen prüfen'][step-1]),
    element('p','Schritt '+step+' von 3'));
  const fields = element('div','');
  fields.className = 'fields project-fields';
  form.append(fields);
  if (step===1) {
    const name = element('input','');
    name.required = true;
    name.maxLength = 100;
    name.value = project.name;
    name.oninput = () => { project.name = name.value; };
    projectField(fields,'Projektname',name);
    const owned = [...cards.querySelectorAll('article[id]')].filter(card=>card.hasAttribute('data-local') || hasRecordedStock(card.id));
    const types = [...new Set(owned.map(card=>card.dataset.material))].sort();
    for (const [index,line] of project.lines.entries()) {
      const row = element('fieldset','');
      row.append(element('legend','Filament '+(index+1)));
      const type = element('select','');
      type.add(new Option('Alle Materialarten',''));
      for (const value of types) type.add(new Option(value,value));
      type.value = line.type ?? document.getElementById(line.cardId)?.dataset.material ?? '';
      type.onchange = () => {
        line.type = type.value;
        const card = document.getElementById(line.cardId);
        if (line.type && card?.dataset.material!==line.type) { delete line.cardId; delete line.label; }
        rerender();
      };
      projectField(row,'Materialart',type);
      const select = element('select','');
      select.required = true;
      select.add(new Option('Filament aus „Meine Filamente“ wählen',''));
      for (const card of owned.filter(card=>!type.value || card.dataset.material===type.value)) {
        select.add(new Option(card.querySelector('h2').textContent+' · '+card.dataset.color,card.id));
      }
      select.value = line.cardId ?? '';
      select.onchange = () => {
        line.cardId = select.value;
        line.label = select.selectedOptions[0].textContent;
      };
      projectField(row,'Filament und Farbe',select);
      if (project.lines.length>1) row.append(projectButton('Position entfernen',()=>{
        project.lines.splice(index,1);
        rerender();
      }));
      fields.append(row);
    }
    fields.append(projectButton('Filament hinzufügen',()=>{ project.lines.push({dry:'check',reserve:0}); rerender(); }));
  } else if (step===2) {
    for (const line of project.lines) {
      const row = element('fieldset','');
      row.append(element('legend',line.label));
      const need = projectGrams(row,'Bedarf laut Slicer (g)',line.need,0.001);
      const reserve = projectGrams(row,'Reserve (g)',line.reserve);
      need.oninput = () => { line.need = need.valueAsNumber; };
      reserve.oninput = () => { line.reserve = reserve.valueAsNumber; };
      const single = element('input','');
      single.type = 'checkbox';
      single.checked = line.single ?? false;
      single.onchange = () => { line.single = single.checked; };
      projectField(row,'Eine Rolle muss reichen',single);
      const dry = element('select','');
      for (const [value,label] of [['check','Trocknung prüfen'],['required','Trocknung erforderlich'],['none','Keine Vorgabe']]) dry.add(new Option(label,value));
      dry.value = line.dry;
      dry.onchange = () => { line.dry = dry.value; };
      projectField(row,'Muss das Filament vorher getrocknet sein?',dry);
      fields.append(row);
    }
  } else {
    projectStockRows(project,fields,route,rerender);
    fields.append(element('p','Offene Projekte reservieren kein Filament.'));
  }
  if (step>1) form.append(projectButton('Zurück',()=>{ projectDraft.step--; rerender(); }));
  const save = element('button',step===3 ? 'Projekt speichern' : 'Weiter');
  form.append(save,status);
  form.onsubmit = async event => {
    event.preventDefault();
    if (!project.name.trim()) { status.textContent = 'Gib einen Projektnamen ein.'; return; }
    if (step<3) { projectDraft.step++; rerender(); return; }
    const next = {...project,name:project.name.trim(),lines:project.lines.map(({type,...line})=>({...line,single:line.single ?? false}))};
    save.disabled = true;
    const saved = await changeProjects(projects=>{
      const existing = projects.find(item=>item.id===next.id);
      if ((existing ? JSON.stringify(existing) : null)!==baseline) throw Error('Dieses Projekt wurde inzwischen geändert.');
      return existing ? projects.map(item=>item.id===next.id ? next : item) : [...projects,next];
    },status);
    if (!saved) { save.disabled = false; return; }
    projectDraft = undefined;
    returnAfterRollSave('projekt','Projekt „'+next.name+'“ gespeichert.');
  };
  projectPanel.append(form);
  if (stored && step===3) projectPanel.append(projectButton('Projekt abschließen',()=>{
    if (JSON.stringify({...project,lines:project.lines.map(({type,...line})=>line)})!==JSON.stringify(stored)) {
      status.textContent = 'Speichere zuerst deine Projektänderungen.';
      return;
    }
    projectPanel.replaceChildren();
    projectFinish(stored,route);
  }));
}

function validateProjectUse(cardId,rollId,grams,revision,previous = 0) {
  const raw = stockForCard(cardId).find(roll=>roll.id===rollId);
  if (!raw || (raw.weightRevision ?? '')!==revision || weightKind(raw,'')!=='recorded') {
    throw Error('Die Rolle oder ihr Gewicht hat sich geändert. Öffne die Buchung erneut.');
  }
  const available = Number(currentProjectRoll(cardId,raw).weight);
  if (grams>projectWeight(available+previous)) throw Error('Der Verbrauch ist höher als das verfügbare Restgewicht.');
}

function closeProject(projects,project,bookings,date) {
  const current = projects.find(item=>item.id===project.id);
  if (!current || current.closed) throw Error('Das Projekt wurde bereits abgeschlossen oder entfernt.');
  if (JSON.stringify(current)!==JSON.stringify(project)) throw Error('Das Projekt wurde inzwischen geändert.');
  for (const row of bookings) validateProjectUse(row.cardId,row.rollId,row.entries[0].grams,row.revision);
  return projects.map(item=>item.id===project.id ? {...current,closed:date,bookings} : item);
}

function projectFinish(project,route) {
  const form = element('form','');
  const status = element('p','');
  status.setAttribute('role','status');
  form.append(element('h2','Projekt abschließen'),element('p','Trage den tatsächlichen Verbrauch je Rolle ein. Unbenutzte Rollen bleiben bei 0 g.'));
  const inputs = [];
  for (const group of projectGroups(project.lines)) {
    const field = element('fieldset','');
    field.append(element('legend',group.label));
    for (const {roll,index,kind,grams} of projectInventory(group,project.excluded)) {
      const label = group.label+' · Rolle '+(index+1);
      if (kind!=='recorded') {
        field.append(element('p','Rolle '+(index+1)+' · vor einer Buchung wiegen'),
          rollActionLink(group.cardId,roll.id,route,'Wiegen','weigh'));
        continue;
      }
      const input = projectGrams(field,'Rolle '+(index+1)+' · Verbrauch (g)',0);
      input.max = String(grams);
      const preview = element('p','');
      input.oninput = () => { preview.textContent = input.validity.valid ?
        gramsLabel(grams)+' → '+gramsLabel(projectWeight(grams-input.valueAsNumber))+' Restgewicht' : 'Verbrauch prüfen'; };
      input.oninput();
      field.append(preview);
      inputs.push({input,cardId:group.cardId,rollId:roll.id,label,revision:roll.weightRevision ?? ''});
    }
    form.append(field);
  }
  const save = element('button','Verbrauch buchen und abschließen');
  form.append(projectButton('Zurück zur Prüfung',()=>renderProjects(route)),save,status);
  form.onsubmit = async event => {
    event.preventDefault();
    save.disabled = true;
    const date = new Date().toISOString();
    const bookings = inputs.filter(row=>row.input.valueAsNumber>0).map(({input,...row})=>({...row,entries:[{date,grams:input.valueAsNumber}]}));
    if (!bookings.length) { status.textContent = 'Trage den Verbrauch für mindestens eine Rolle ein.'; save.disabled = false; return; }
    const saved = await changeProjects(projects=>closeProject(projects,project,bookings,date),status);
    if (!saved) { save.disabled = false; return; }
    projectDraft = undefined;
    returnAfterRollSave('projekt/historie','Projekt „'+project.name+'“ abgeschlossen.');
  };
  projectPanel.append(form);
}

function projectHistoryDetail(project) {
  projectPanel.append(element('h2',project.name),
    element('p','Abgeschlossen am '+new Date(project.closed).toLocaleDateString('de-DE')));
  for (const group of projectGroups(project.lines)) {
    projectPanel.append(element('p',group.label+' · '+gramsLabel(group.need)+' geplant'));
  }
  for (const row of project.bookings) {
    const section = element('details','');
    const last = row.entries.at(-1);
    const form = element('form','');
    const status = element('p','');
    status.setAttribute('role','status');
    section.append(element('summary',row.label+' · '+gramsLabel(last.grams)+' gebucht'));
    for (const [index,entry] of row.entries.entries()) section.append(element('p',
      (index ? 'Korrektur' : 'Abschluss')+' · '+gramsLabel(entry.grams)+' · '+new Date(entry.date).toLocaleString('de-DE')));
    const input = projectGrams(form,'Korrigierter Verbrauch (g)',last.grams);
    const raw = stockForCard(row.cardId).find(roll=>roll.id===row.rollId);
    const affectsStock = raw && (raw.weightRevision ?? '')===row.revision && weightKind(raw,'')==='recorded';
    const preview = element('p','');
    const save = element('button','Korrektur speichern');
    input.oninput = () => {
      save.disabled = !input.validity.valid || input.valueAsNumber===last.grams;
      preview.textContent = affectsStock ?
        (input.validity.valid ? 'Änderung am aktuellen Restgewicht: '+gramsLabel(projectWeight(last.grams-input.valueAsNumber)) : '') :
        'Nur die Historie ändert sich. Die Rolle wurde inzwischen neu gewogen oder ist nicht mehr im Bestand.';
    };
    input.oninput();
    form.append(preview,save,status);
    form.onsubmit = async event => {
      event.preventDefault();
      const grams = input.valueAsNumber;
      save.disabled = true;
      const saved = await changeProjects(projects=>{
        const current = projects.find(item=>item.id===project.id);
        const match = current?.bookings?.find(item=>item.cardId===row.cardId && item.rollId===row.rollId);
        if (!match || JSON.stringify(match)!==JSON.stringify(row)) throw Error('Die Buchung wurde inzwischen geändert.');
        const roll = stockForCard(row.cardId).find(item=>item.id===row.rollId);
        if (roll && (roll.weightRevision ?? '')===row.revision && weightKind(roll,'')==='recorded') {
          validateProjectUse(row.cardId,row.rollId,grams,row.revision,last.grams);
        }
        return projects.map(item=>item.id===project.id ? {...current,bookings:current.bookings.map(item=>item===match ?
          {...match,entries:[...match.entries,{date:new Date().toISOString(),grams}]} : item)} : item);
      },status);
      if (saved) renderProjects('projekt/'+project.id);
      else save.disabled = false;
    };
    section.append(form);
    projectPanel.append(section);
  }
}

function renderProjects(route) {
  projectPanel.replaceChildren();
  if (projectRoute.test(route)) {
    projectWizard(route);
    return;
  }
  const history = route==='projekt/historie';
  const nav = element('p','');
  nav.append(projectLink(history ? 'Offene Projekte' : 'Projekthistorie',history ? 'projekt' : 'projekt/historie'),
    document.createTextNode(' · '),projectLink('Neues Projekt','projekt/neu'));
  projectPanel.append(nav);
  const list = element('div','');
  const entries = readProjects().filter(item=>Boolean(item.closed)===history);
  const renderList = () => {
    list.replaceChildren();
    for (const project of [...entries].reverse()) {
      if (history && !normalizeSearch([project.name,...project.lines.map(line=>line.label)].join(' ')).includes(normalizeSearch(historyFilter))) continue;
      const row = element('article','');
      row.className = 'stock-roll-entry';
      row.append(projectLink(project.name,'projekt/'+project.id));
      if (history) row.append(element('p','Abgeschlossen am '+new Date(project.closed).toLocaleDateString('de-DE')));
      else {
        const tones = projectGroups(project.lines).map(group=>projectAvailability(group,projectInventory(group,project.excluded)).tone);
        const tone = tones.includes('red') ? 'red' : tones.includes('yellow') ? 'yellow' : 'green';
        const indicator = element('p',{red:'Menge fehlt',yellow:'Menge prüfen',green:'Menge reicht'}[tone]);
        indicator.className = 'project-'+tone;
        row.append(indicator);
      }
      list.append(row);
    }
    if (!list.children.length) list.append(element('p',history ? 'Keine passenden abgeschlossenen Projekte.' : 'Keine offenen Projekte.'));
  };
  if (history) {
    const filter = element('input','');
    filter.type = 'search';
    filter.value = historyFilter;
    filter.oninput = () => { historyFilter = filter.value; renderList(); };
    projectField(projectPanel,'Nach Projekt oder Filament suchen',filter);
  }
  projectPanel.append(list);
  renderList();
}
