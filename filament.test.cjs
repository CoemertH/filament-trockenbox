const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createHash} = require('node:crypto');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname,file),'utf8');
const app = read('filament-app.js');
const html = read('index.html');
function section(first,last) {
  const start = app.indexOf(first);
  const end = app.indexOf(last,start);
  assert.ok(start>=0 && end>start);
  return app.slice(start,end);
}
const stored = new Map();
const scope = vm.createContext({
  cards:{querySelectorAll:()=>[]},
  key:'filament-trockenbox-rolls',
  locationKey:'filament-lagerorte',
  locationOrderKey:'filament-lagerorte-reihenfolge',
  dryingIntervalKey:'filament-trocknungsintervalle',
  printerKey:'filament-drucker',
  nozzleVariantKey:'filament-duesenvarianten',
  localStorage:{getItem:key=>stored.get(key) ?? null},
  rolls:[{id:'old',material:'TPU',farbe:'Blau',gewicht:'750 g'}],
  editing:'old',colorInput:{},shadeInput:{},form:{elements:{farbfamilie:{}}},
  status:{},findDuplicateCard:()=>null,render(){},updateColorPalette(){},updateCardSave(){},
  document:{getElementById:()=>null,querySelector:()=>null}
});
scope.localStorage.setItem = (key,value)=>stored.set(key,value);
new vm.Script(app);
vm.runInContext(read('filament-stock.js'),scope);
vm.runInContext(read('filament-projects.js'),scope);
vm.runInContext(section('function writeStorage','const firstDone'),scope);
vm.runInContext(section('const dryingStates','function renderDryingDashboard'),scope);
vm.runInContext(section('const settingsKey','function legacyMigrationPending'),scope);
vm.runInContext(section('const backupPrefixes','document.querySelector(\'#backup-export\')'),scope);
vm.runInContext(section('function selectDraftColor','function clearEditor'),scope);
vm.runInContext(section('const materialTypes','function makeSwatch'),scope);
vm.runInContext(section('function normalizeSearch','let previousRoute'),scope);

test('Materialarten und Farbfamilien älterer Karten',()=>{
  assert.equal(scope.materialType('SUNLU TPU 95A'),'TPU');
  assert.equal(scope.materialType('Bambu TPU 90A'),'TPU');
  assert.equal(scope.materialType('SUNLU PLA+'),'PLA+');
  assert.equal(scope.materialType('Eigenes Filament','petg'),'PETG');
  assert.equal(scope.colorFamily('Klein-Blau'),'Blau');
  assert.equal(scope.colorFamily('Perlmutt','Weiß'),'Weiß');
});
test('Farbauswahl bleibt bis zum Speichern im Entwurf',()=>{
  scope.selectDraftColor('Gelb');
  assert.equal(scope.colorInput.value,'Gelb');
  assert.equal(stored.has(scope.key),false);
  stored.clear();
});
test('Gewichte bleiben je Kategorie getrennt',()=>{
  assert.equal(scope.weightDescription({packaging:'sealed',weight:''},'750 g'),'750 g Nenngewicht');
  assert.equal(scope.weightDescription({packaging:'opened',weight:'0'},'750 g'),'0 g erfasster Rest');
  assert.equal(scope.weightDescription({packaging:'opened',weight:''},'750 g'),'Restgewicht unbekannt');
});
test('Sicherung akzeptiert Altbestand und neue Lagerreihenfolge und Trocknung',()=>{
  const stockKey='filament-bestand:eigene-rolle-11111111-1111-4111-8111-111111111111';
  const old={id:'erste-rolle',packaging:'opened',weight:'350',locationId:'regal'};
  const drying={date:'2026-11-07',device:'Trockenbox',temperature:55,hours:8};
  const records={
    [scope.key]:JSON.stringify([{id:'11111111-1111-4111-8111-111111111111',material:'Test PETG',farbe:'Rot'}]),
    [scope.locationKey]:JSON.stringify([{id:'regal',name:'Regal'},{id:'schrank',name:'Schrank'}]),
    [scope.locationOrderKey]:'["schrank","regal"]',
    [scope.dryingIntervalKey]:'{"support-pla-petg-schwarz":14}',
    [stockKey]:JSON.stringify([{...old,drying:[drying]}])
  };
  assert.equal(scope.validateBackup({version:1,records}),records);
  const plan = scope.backupPlan(records,{});
  assert.equal(plan.issues.length,0);
  assert.equal(plan.writes.length,5);
  assert.doesNotThrow(()=>scope.validateBackup({version:1,records:{[stockKey]:JSON.stringify([old])}}));
  assert.throws(()=>scope.validateBackup({version:1,records:{[scope.locationOrderKey]:'["regal","regal"]'}}));
  assert.equal(scope.validDryingSession({...drying,date:'2026-02-30'}),false);
});
test('Umlagerung lässt dieselbe Rollen-ID und den Trocknungsverlauf bestehen',()=>{
  const route = section('  transfer.onsubmit','  status.textContent = message;');
  const vmScope = vm.createContext({
    transfer:{},save:{disabled:false},destination:{value:'id:regal'},newName:{value:''},
    readLocations:()=>[{id:'regal',name:'Regal'}],
    selected:new Map([['one',{id:'card',rollId:'one',locationId:'schrank'}]]),
    stockForCard:()=>[{id:'one',locationId:'schrank',weight:'350',drying:[{device:'Trockenbox'}]}],
    saveRecords:records=>{ for (const [name,value] of records) stored.set(name,JSON.stringify(value)); return true; },cards:{children:[]},openLocationGroups:new Set(),renderLocationOverview(){},status:{}
  });
  vm.runInContext(route,vmScope);
  vmScope.transfer.onsubmit({preventDefault(){}});
  assert.deepEqual(JSON.parse(stored.get('filament-bestand:card')),[{id:'one',locationId:'regal',weight:'350',drying:[{device:'Trockenbox'}]}]);
  stored.clear();
});
test('Alle eingebetteten QR-Ziele besitzen weiterhin eine Karte',()=>{
  const payload = app.match(/^const qrCodes = (\{[^\n]+\});$/m);
  assert.equal(createHash('sha256').update(payload[0]+'\n').digest('hex'),'29f8cba7095fed656515459b9131573c68f31cbaff67556e3aa72c77e2bf5a39');
  const codes = JSON.parse(payload[1]);
  assert.equal(Object.keys(codes).length,12);
  for (const id of Object.keys(codes)) {
    assert.ok(html.includes('<article id="'+id+'"'));
    assert.ok(html.includes('href="#'+id+'"'));
  }
});

test('Trocknungsampel unterscheidet alle Fristen und manuelle Markierungen',()=>{
  const today=new Date(2026,10,8,12);
  const roll={drying:[{date:'2026-11-01',device:'Trockenbox',temperature:55,hours:8}]};
  assert.equal(scope.dryingSchedule(roll,7,today).state,'due');
  assert.equal(scope.dryingSchedule(roll,10,today).state,'soon');
  assert.equal(scope.dryingSchedule(roll,11,today).state,'planned');
  assert.equal(scope.dryingSchedule(roll,null,today).state,'open');
  assert.equal(scope.dryingSchedule({dryingDue:true},null,today).state,'due');
  assert.equal(scope.dryingSchedule({},7,today).state,'open');
});

test('Sicherungen führen verschiedene Rollen zusammen und normalisieren Restgewicht',()=>{
  const id='11111111-1111-4111-8111-111111111111';
  const stock='filament-bestand:eigene-rolle-'+id;
  const roll={id:'a',packaging:'opened',weight:'480'};
  const incoming={id:'b',packaging:'opened',weight:'400',gross:'710',tare:'210'};
  const current={[scope.key]:JSON.stringify([{id,material:'PETG',farbe:'Rot'}]),[stock]:JSON.stringify([roll])};
  const plan=scope.backupPlan({[stock]:JSON.stringify([incoming])},current,'replace');
  assert.equal(plan.conflicts.length,0);
  assert.deepEqual(JSON.parse(Object.fromEntries(plan.writes)[stock]),[roll,{...incoming,weight:'500'}]);
  assert.equal(scope.backupPlan({[stock]:JSON.stringify([incoming])},{},'restore').issues.length,1);
});

test('Mehrere Speicheränderungen werden nach einem Schreibfehler zurückgenommen',()=>{
  stored.set('test-a','vorher');
  const original = scope.localStorage.setItem;
  scope.localStorage.setItem = (name,value)=>{
    if (name==='test-b') throw Error('Speicher voll');
    original(name,value);
  };
  try {
    assert.equal(scope.writeStorage([['test-a','nachher'],['test-b','neu']]),false);
    assert.equal(stored.get('test-a'),'vorher');
    assert.equal(stored.has('test-b'),false);
  } finally {
    scope.localStorage.setItem = original;
    stored.clear();
  }
});

test('Projekt zählt eine Rolle nur einmal und trennt Mengenampel von Schätzwerten',()=>{
  const line = {cardId:'petg',need:210,reserve:0,single:false,dry:'check'};
  const [group] = scope.projectGroups([line,line]);
  const rolls = [{kind:'recorded',grams:300},{kind:'recorded',grams:180}];
  assert.equal(group.need,420);
  assert.equal(scope.projectAvailability(group,rolls).tone,'yellow');
  assert.equal(scope.projectAvailability({...group,single:true},rolls).tone,'red');
  assert.equal(scope.projectAvailability(group,[{kind:'nominal',grams:500}]).tone,'yellow');
  assert.equal(scope.projectAvailability(group,[{kind:'recorded',grams:500}]).tone,'green');
});

test('Abschluss bucht einmal, Sicherungen spielen keinen Verbrauch erneut ein, neue Wägung hat Vorrang',()=>{
  const projectId = '11111111-1111-4111-8111-111111111111';
  const cardId = 'eigene-rolle-'+projectId;
  const stockKey = 'filament-bestand:'+cardId;
  const date = '2026-11-08T15:02:00.000Z';
  const open = {id:projectId,name:'Testdruck',excluded:[],lines:[{cardId,label:'PETG',need:120,reserve:0,single:false,dry:'check'}]};
  const raw = {id:'roll1',weight:'500',gross:'700',tare:'200',packaging:'opened'};
  scope.stockForCard = id => JSON.parse(stored.get('filament-bestand:'+id) ?? '[]');
  const booking = {cardId,rollId:raw.id,label:'PETG · Rolle 1',revision:'',entries:[{date,grams:120}]};
  stored.clear();
  try {
    stored.set(stockKey,JSON.stringify([raw]));
    const history = scope.closeProject([open],open,[booking],date);
    stored.set('filament-projekte',JSON.stringify(history));
    assert.equal(scope.currentProjectRoll(cardId,raw).weight,'380');
    assert.throws(()=>scope.closeProject(history,open,[booking],date),/bereits abgeschlossen/);
    const records = {
      [scope.key]:JSON.stringify([{id:projectId,material:'Test PETG',farbe:'Schwarz'}]),
      [stockKey]:JSON.stringify([raw]),
      'filament-projekte':JSON.stringify(history)
    };
    assert.doesNotThrow(()=>scope.validateBackup({version:1,records}));
    assert.equal(scope.backupPlan(records,records).writes.length,0);
    assert.equal(scope.currentProjectRoll(cardId,{...raw,weight:'360',weightRevision:'new'}).weight,'360');
    booking.entries.push({date,grams:100});
    stored.set('filament-projekte',JSON.stringify(history));
    assert.equal(scope.currentProjectRoll(cardId,raw).weight,'400');
    assert.equal(scope.currentProjectRoll(cardId,{...raw,weight:'360',weightRevision:'new'}).weight,'360');
  } finally { stored.clear(); }
});
