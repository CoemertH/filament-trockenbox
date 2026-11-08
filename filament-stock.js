'use strict';

function nominalWeight(card) {
  const field = [...card.querySelectorAll('dl dt')].find(item=>['Filamentgewicht','Gewicht'].includes(item.textContent));
  const text = field?.nextElementSibling?.textContent.trim();
  return text && text !== 'Nicht angegeben' ? text : '';
}

function weightKind(roll, nominal) {
  if (roll.weight != null && String(roll.weight).trim() && Number.isFinite(Number(roll.weight)) && Number(roll.weight)>=0) return 'recorded';
  return roll.packaging === 'sealed' && nominal ? 'nominal' : 'unknown';
}

function gramsLabel(value) {
  return Number(value).toLocaleString('de-DE',{maximumFractionDigits:3})+' g';
}

function weightDescription(roll, nominal) {
  const kind = weightKind(roll,nominal);
  if (kind==='recorded') return gramsLabel(roll.weight)+' erfasster Rest';
  if (kind==='nominal') return nominal+' Nenngewicht';
  return 'Restgewicht unbekannt';
}

function weightTotals(rolls, nominal) {
  const totals = {recorded:0,nominal:0,unknown:0};
  let grams = 0;
  for (const roll of rolls) {
    const kind = weightKind(roll,nominal);
    totals[kind]++;
    if (kind==='recorded') grams += Number(roll.weight);
  }
  const summary = [];
  if (totals.recorded) summary.push(gramsLabel(grams)+' erfasster Rest');
  if (totals.nominal) summary.push(totals.nominal+' × '+nominal+' Nenngewicht');
  if (totals.unknown) summary.push(totals.unknown+(totals.unknown===1?' Restgewicht unbekannt':' Restgewichte unbekannt'));
  return summary;
}

function validDryingSession(session) {
  if (!session || typeof session.date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(session.date) ||
      typeof session.device!=='string' || !session.device.trim() || session.device.length>80) return false;
  const date = new Date(session.date+'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===session.date &&
    typeof session.temperature==='number' && Number.isFinite(session.temperature) &&
    typeof session.hours==='number' && Number.isFinite(session.hours) && session.hours>0;
}

function dryingHistory(roll, save) {
  const section = element('details','');
  section.className = 'drying-history';
  const history = [...(Array.isArray(roll.drying) ? roll.drying : [])].filter(validDryingSession).reverse().sort((a,b)=>b.date.localeCompare(a.date));
  const dateLabel = date => date.split('-').reverse().join('.');
  section.append(element('summary',history.length ? 'Zuletzt getrocknet: '+dateLabel(history[0].date) : 'Trocknungsverlauf'));
  if (history.length) {
    const list = element('ul','');
    for (const entry of history) {
      list.append(element('li',[dateLabel(entry.date),entry.device,entry.temperature.toLocaleString('de-DE')+' °C',entry.hours.toLocaleString('de-DE')+' Std.'].join(' · ')));
    }
    section.append(list);
  } else section.append(element('p','Für diese Rolle ist noch keine Trocknung erfasst.'));
  const editor = element('form','');
  const fields = element('div','');
  fields.className = 'fields';
  for (const [name,title,type] of [
    ['date','Datum','date'],['device','Trocknungsgerät','text'],
    ['temperature','Temperatur (°C)','number'],['hours','Dauer (Stunden)','number']
  ]) {
    const label = element('label',title);
    const input = element('input','');
    input.name = name;
    input.type = type;
    input.required = true;
    if (name==='date') {
      const today = new Date();
      input.value = [today.getFullYear(),today.getMonth()+1,today.getDate()].map(value=>String(value).padStart(2,'0')).join('-');
    }
    if (name==='device') input.maxLength = 80;
    if (type==='number') { input.step = 'any'; input.inputMode = 'decimal'; }
    if (name==='hours') input.min = '0.01';
    label.append(input);
    fields.append(label);
  }
  const status = element('p','');
  status.setAttribute('role','status');
  editor.append(fields,element('button','Trocknung speichern'),status);
  editor.onsubmit = event => {
    event.preventDefault();
    const {date,device,temperature,hours} = editor.elements;
    const session = {date:date.value,device:device.value.trim(),temperature:temperature.valueAsNumber,hours:hours.valueAsNumber};
    if (!validDryingSession(session)) { status.textContent = 'Prüfe Datum, Gerät, Temperatur und Dauer.'; return; }
    if (!save(session)) status.textContent = 'Die Trocknung konnte nicht gespeichert werden.';
  };
  section.append(editor);
  return section;
}
