const assert = require('node:assert/strict');
const fs = require('node:fs');
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
  printerKey:'filament-drucker',
  nozzleVariantKey:'filament-duesenvarianten',
  localStorage:{getItem:key=>stored.get(key) ?? null},
  rolls:[{id:'old',material:'TPU',farbe:'Blau',gewicht:'750 g'}],
  editing:'old',colorInput:{},shadeInput:{},form:{elements:{farbfamilie:{}}},
  status:{},findDuplicateCard:()=>null,render(){},updateColorPalette(){},updateCardSave(){},
  document:{getElementById:()=>null}
});
scope.localStorage.setItem = (key,value)=>stored.set(key,value);
new vm.Script(app);
vm.runInContext(read('filament-stock.js'),scope);
vm.runInContext(section('const backupPrefixes','document.querySelector(\'#backup-export\')'),scope);
vm.runInContext(section('function saveSelectedColor','function clearEditor'),scope);
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
test('Farbauswahl ändert nur die Farbmetadaten der gespeicherten Karte',()=>{
  scope.saveSelectedColor('Gelb');
  assert.deepEqual(JSON.parse(stored.get(scope.key)),[{id:'old',material:'TPU',farbe:'Gelb',gewicht:'750 g',farbton:'',farbfamilie:''}]);
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
    [scope.locationKey]:JSON.stringify([{id:'regal',name:'Regal'},{id:'schrank',name:'Schrank'}]),
    [scope.locationOrderKey]:'["schrank","regal"]',
    [stockKey]:JSON.stringify([{...old,drying:[drying]}])
  };
  assert.equal(scope.validateBackup({version:1,records}),records);
  assert.equal(scope.backupPlan(records).length,4);
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
    localStorage:scope.localStorage,cards:{children:[]},openLocationGroups:new Set(),renderLocationOverview(){},status:{}
  });
  vm.runInContext(route,vmScope);
  vmScope.transfer.onsubmit({preventDefault(){}});
  assert.deepEqual(JSON.parse(stored.get('filament-bestand:card')),[{id:'one',locationId:'regal',weight:'350',drying:[{device:'Trockenbox'}]}]);
  stored.clear();
});
test('Alle eingebetteten QR-Ziele besitzen weiterhin eine Karte',()=>{
  const codes = JSON.parse(app.match(/const qrCodes = (\{[^\n]+\});/)[1]);
  assert.equal(Object.keys(codes).length,12);
  for (const id of Object.keys(codes)) {
    assert.ok(html.includes('<article id="'+id+'"'));
    assert.ok(html.includes('href="#'+id+'"'));
  }
});
