'use strict';

const paths = {
  plus: '<path d="M8 2v12M2 8h12"/>',
  close: '<path d="m4 4 8 8m0-8-8 8"/>',
  search: '<circle cx="6.7" cy="6.7" r="4.4"/><path d="m10 10 3.5 3.5"/>',
  filter: '<path d="M2 3h12L9 8v4l-2 1V8z"/>',
  sort: '<path d="M4 2v11m-3-3 3 3 3-3m5 4V3M9 6l3-3 3 3"/>',
  columns: '<path d="M0 2h7m2 0h7M0 6h7m2 0h7M0 10h7m2 0h7M0 14h7m2 0h7"/>',
  external: '<path d="M3 12 12 3M6 3h6v6M2 14h12"/>',
  refresh: '<path d="M13 6a5.5 5.5 0 1 0-1 6M13 2v4H9"/>',
  warning: '<path d="M8 2 15 14H1L8 2Zm0 4v4m0 1.5v.1"/>',
};
function icon(name) {
  const svg = figmaIcons[name] ?? '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
  return '<span class="icon" aria-hidden="true">' + svg + '</span>';
}
const $ = selector => document.querySelector(selector);
const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const number = value => value == null ? '—' : value.toLocaleString('en-US');
const rate = value => value == null ? '—' : value.toFixed(1) + '%';
const money = value => value == null ? '—' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);

const regions = ['APAC', 'EU', 'US_EAST'];
const types = ['RTB', 'VAST', 'Prebid'];
const data = {
  supply: [
    ['Northstar Video Supply','SSP-1042','RTB','APAC',3846,78.2,36.4,91.7,2.84],
    ['Northstar Video Supply · US','SSP-1186','VAST','US_EAST',1436,63.9,28.1,88.3,2.32],
    ['Open Media Exchange','SSP-1204','Prebid','EU',2445,72.4,31.6,93.1,2.61],
    ['Vista Streaming Network','SSP-1215','RTB','EU',null,null,null,null,null],
    ['Harbor Test Supply','SSP-1232','RTB','APAC',0,null,null,null,null,false],
  ],
  demand: [
    ['Atlas Video Exchange','DSP-3140','VAST','EU',1937,69.2,30.8,88.5,2.49],
    ['Meridian Demand','DSP-3056','RTB','US_EAST',1168,64.1,27.6,86.2,2.21],
    ['Vector Media Buying','DSP-3012','RTB','APAC',2461,71.4,34.8,90.6,2.68],
    ['Cedar Test Demand','DSP-3226','Prebid','EU',0,null,null,null,null,false],
  ],
};
const endpointLists = Object.fromEntries(Object.entries(data).map(([side, rows]) => [side, rows.map(([name,id,type,region,qps,fill,win,render,rcpm,active=true]) => ({name,id,type,region,qps,fill,win,render,rcpm,active}))]));
const states = Object.fromEntries(['supply','demand'].map(side => [side, {query:'',regions:new Set(side==='demand'?regions:[]),status:'active',sort:'original',size:25,page:1,hidden:new Set()}]));
const columns = [
  ['name','Name / ID',20.65],['status','Status',10.2],['type','Type',7],['region','Region',8],
  ['qps','Incoming QPS',9.15,'num'],['fill','Fill rate',8.2,'num'],['win','Win rate',8,'num'],
  ['render','Render rate',8.6,'num'],['rcpm','rCPM',9,'num'],['details','Details',10.2],
];
const sortOptions = {
  original: {label:'Default order'},
  name: {label:'Name A–Z', column:'Name', direction:'ascending'},
  qps: {label:'Highest Incoming QPS', column:'Incoming QPS', direction:'descending'},
  fill: {label:'Highest fill rate', column:'Fill rate', direction:'descending'},
  rcpm: {label:'Highest rCPM', column:'rCPM', direction:'descending'},
};
const regionalTraffic = [
  ['US_EAST',1436,1318,8595,20000,true],['APAC',3846,3612,9876,10000],['EU',2445,2320,6763,10000],
];
const regionalIncoming = new Map(regionalTraffic.map(([region,incoming])=>[region,incoming]));
const shareFormat = new Intl.NumberFormat('en-US',{style:'percent',maximumFractionDigits:2});
const trafficViews = [
  {name:'Regions',icon:'region',first:'Region',rows:regionalTraffic},
  {name:'Traffic Types',icon:'statistics',first:'Traffic type',rows:[
    ['RTB',4980,4650,15321],['VAST',1841,1730,6467],['Prebid',906,870,3446],
  ]},
  {name:'Ad Formats',icon:'format',first:'Ad format',rows:[
    ['Video',4031,3758,14089],['Display',2986,2812,8810],['Native',710,680,2335],
  ]},
];
const financeViews = [
  {name:'Profit',today:1890.35,yesterday:1742.62},
  {name:'SSP Spend',today:4180.24,yesterday:4005.67},
  {name:'DSP Spend',today:6070.59,yesterday:5748.29},
];
let trafficTab = 0;
let financeTab = 0;
const times = {traffic:'14:00',finance:'14:00'};
const refreshCount = {traffic:0,finance:0};

const nav = [['Dashboard',true],['Statistics',true],['Analytics Dashboard'],['Billing'],['List Manager'],['Sellers.json',true],['Crawlers',true],['Loggers',true]];
$('#navigation').innerHTML = nav.map(([name,drop]) => '<button data-section="'+name+'">'+name+(drop?icon('chevron'):'')+'</button>').join('');
const utilities = [
  [['settings','Platform settings'],['frameworks','Frameworks'],['integrations','Integrations'],['traffic','Traffic analyzer'],['funds','Funds'],['companies','Companies'],['mismatches','Mismatches']],
  [['account','Account'],['support','Support'],['knowledge','Knowledge base'],['notification','Notifications'],['exit','Sign out']],
  [['panel','Utility panel']],
];
$('#sidebar').innerHTML = utilities.map(group => '<div class="group">'+group.map(([asset,name]) => '<button aria-label="'+name+'" title="'+name+'" data-section="'+name+'">'+icon(asset)+(asset==='notification'?'<span class="counter">0</span>':'')+'</button>').join('')+'</div>').join('');
$('#finance-details').innerHTML = icon('external');

function tabs(kind, items, selected) {
  const container = $('#'+kind+'-tabs');
  container.innerHTML = items.map((item,i) => '<button id="'+kind+'-tab-'+i+'" role="tab" type="button" data-tab="'+kind+'" data-index="'+i+'" aria-controls="'+kind+'-content" aria-selected="'+(selected===i)+'" tabindex="'+(selected===i?0:-1)+'">'+(item.icon?icon(item.icon):'')+item.name+'</button>').join('');
  $('#'+kind+'-content').setAttribute('aria-labelledby',kind+'-tab-'+selected);
}
function utilization(value,limit) {
  if (!limit) return '';
  const percent = (value / limit * 100).toFixed(2);
  const warning = value / limit >= .95;
  return '<span class="badge'+(warning?' warning':'')+'"'+(warning?' title="Approaching illustrative limit"':'')+'>'+percent+'%'+(warning?icon('warning')+'<span class="visually-hidden"> · Approaching limit</span>':'')+'</span>';
}
function updated(kind) {
  $('#'+kind+'-updated').innerHTML = 'Updated '+times[kind]+' UTC <button data-refresh="'+kind+'" aria-label="Refresh '+(kind==='traffic'?'traffic overview':'financial comparison')+'">'+icon('refresh')+'</button>';
}
function renderTraffic() {
  const view = trafficViews[trafficTab];
  tabs('traffic',trafficViews,trafficTab);
  $('#traffic-content').innerHTML = '<table class="summary"><colgroup><col style="width:16.67%"><col style="width:20.65%"><col style="width:22.25%"><col style="width:20.3%"><col></colgroup><thead><tr><th scope="col">'+view.first+'</th><th scope="col">Incoming QPS</th><th scope="col">Valid Incoming QPS</th><th scope="col">Outgoing QPS</th><th scope="col">Limit</th></tr></thead><tbody>'+view.rows.map(([name,incoming,valid,outgoing,limit,main]) =>
    '<tr><td>'+name+(main?'<span class="badge neutral">Main</span>':'')+'</td><td>'+number(incoming)+utilization(incoming,limit)+'</td><td>'+number(valid)+'</td><td>'+number(outgoing)+utilization(outgoing,limit)+'</td><td>'+number(limit)+'</td></tr>').join('')+'</tbody></table>';
  updated('traffic');
}
function renderFinance() {
  const {today,yesterday} = financeViews[financeTab];
  const delta = today-yesterday;
  tabs('finance',financeViews,financeTab);
  $('#finance-content').innerHTML = '<div class="finance-cards"><div class="finance-card">Today<strong>'+money(today)+'</strong></div><div class="finance-card">Yesterday<strong>'+money(yesterday)+'</strong></div></div><div class="finance-delta"><span class="badge">+'+(delta/yesterday*100).toFixed(2)+'%</span><span>+'+money(delta)+' vs yesterday</span></div>';
  updated('finance');
}

function menuButton(action,text,content,classes='select-button',leading='',side='') {
  return '<div class="menu-anchor"><button class="'+classes+'" data-menu="'+action+'" aria-label="'+text+'" aria-expanded="false">'+leading+(side==='icon'?'':'<span class="menu-label">'+text+'</span>')+'<span class="trailing">'+icon('chevron')+'</span></button><div class="menu'+(side==='icon'?' right':'')+'" hidden>'+content+'</div></div>';
}
function initEndpoints(side) {
  const section = $('#'+side);
  const title = side==='supply'?'Supply Side':'Demand Side';
  const filterItems = '<strong>Region</strong>'+regions.map(r => '<label><input type="checkbox" data-region="'+r+'">'+r+'</label>').join('')+'<strong>Configured status</strong>'+[['all','Any status'],['active','Active'],['inactive','Inactive']].map(([value,label])=>'<label><input type="radio" name="'+side+'-status" data-status="'+value+'">'+label+'</label>').join('');
  const sortItems = Object.entries(sortOptions).map(([value,{label}])=>'<button data-sort="'+value+'">'+label+'</button>').join('');
  const columnItems = '<strong>Visible columns</strong>'+columns.slice(1,-1).map(([key,label])=>'<label><input type="checkbox" data-column="'+key+'" checked>'+label+'</label>').join('');
  section.innerHTML = '<header class="endpoint-head"><button class="primary add" data-add aria-label="Add '+side+' endpoint">'+icon('plus')+'</button><h2 id="'+side+'-title">'+title+'</h2><div class="tools">'+menuButton('columns','Visible columns',columnItems,'tool',icon('columns'),'icon')+'<button class="quiet export" data-export>Export '+icon('download')+'</button><button class="quiet icon-button" data-expand aria-label="Expand '+title+'">'+icon('expand')+'</button></div></header>'
    +'<div class="controls"><label class="search">'+icon('search')+'<input type="search" placeholder="Search by name or ID" aria-label="Search '+side+' by name or ID"><span class="trailing">'+icon('chevron')+'</span></label>'+menuButton('filter','Filter',filterItems,'select-button',icon('filter'))+menuButton('sort','Sort by',sortItems,'select-button sort-button',icon('sort'))+'</div>'
    +'<div class="applied"></div><div class="table-scroll table-shell"><table class="endpoint-table" aria-label="'+title+' endpoints"></table></div><div class="pagination"></div>';
  renderEndpoints(side);
}

function matching(side) {
  const state = states[side];
  const query = state.query.trim().toLowerCase();
  const rows = endpointLists[side].filter(row =>
    (!query || (row.name+' '+row.id).toLowerCase().includes(query)) &&
    (!state.regions.size || state.regions.has(row.region)) &&
    (state.status==='all' || row.active===(state.status==='active')));
  const {direction} = sortOptions[state.sort];
  if (direction==='ascending') rows.sort((a,b)=>a[state.sort].localeCompare(b[state.sort]));
  else if (direction==='descending') rows.sort((a,b)=>(b[state.sort]??-Infinity)-(a[state.sort]??-Infinity));
  return rows;
}
function incomingQpsCell(row,side) {
  const value = number(row.qps);
  if (side!=='supply') return value;

  const total = regionalIncoming.get(row.region);
  if (row.qps==null || !(total>0)) {
    return value+'<span class="endpoint-id load-share">Share unavailable</span>';
  }
  const share = shareFormat.format(row.qps/total);
  return value+'<span class="endpoint-id load-share"><strong>'+share+'</strong> of total load</span>';
}

function rowCell(key,row,side) {
  const id = safe(row.id);
  const cells = {
    name:'<button class="link endpoint-name" data-inspect="'+id+'">'+safe(row.name)+'</button><span class="endpoint-id">'+id+'</span>',
    status:'<button class="status-switch" role="switch" aria-checked="'+row.active+'" aria-label="'+safe(row.name)+' configured status" data-toggle="'+id+'"><span class="switch-track"></span>'+(row.active?'Active':'Inactive')+'</button>',
    type:safe(row.type),region:safe(row.region),qps:incomingQpsCell(row,side),fill:rate(row.fill),win:rate(row.win),render:rate(row.render),rcpm:money(row.rcpm),
    details:'<button class="quiet inspect" data-inspect="'+id+'" aria-label="Inspect '+safe(row.name)+'">Inspect</button>',
  };
  return cells[key];
}
function renderEndpoints(side) {
  const state = states[side], section = $('#'+side), rows = matching(side);
  const total = Math.max(1,Math.ceil(rows.length/state.size));
  state.page = Math.min(total,Math.max(1,state.page));
  const shown = rows.slice((state.page-1)*state.size,state.page*state.size);
  const visible = columns.filter(([key])=>!state.hidden.has(key));
  const {column,direction} = sortOptions[state.sort];
  const arrow = direction==='ascending'?'↑':'↓';
  const sortButton = section.querySelector('[data-menu="sort"]');
  sortButton.querySelector('.menu-label').textContent = direction?'Sort: '+column+' '+arrow:'Sort by';
  sortButton.setAttribute('aria-label',direction?'Sort: '+column+' '+direction:'Sort by');
  section.querySelector('table').innerHTML = '<colgroup>'+visible.map(([, ,width])=>'<col style="width:'+width+'%">').join('')+'</colgroup><thead><tr>'+visible.map(([key,label,,align])=>{
    const active = direction && key===state.sort;
    return '<th scope="col" class="'+(align??'')+'"'+(active?' aria-sort="'+direction+'"':'')+'>'+label+(active?' <span class="sort-indicator" aria-hidden="true">'+arrow+'</span>':'')+'</th>';
  }).join('')+'</tr></thead><tbody>'
    +(shown.length?shown.map(row=>'<tr>'+visible.map(([key,,,align])=>'<td class="'+(align??'')+'">'+rowCell(key,row,side)+'</td>').join('')+'</tr>').join(''):'<tr><td class="empty" colspan="'+visible.length+'">No matching endpoints</td></tr>')+'</tbody>';
  const chip = (key,value,label) => '<button class="chip" data-chip="'+key+'" data-value="'+safe(value)+'" aria-label="Remove '+safe(label)+' filter">'+safe(label)+icon('close')+'</button>';
  section.querySelector('.applied').innerHTML = '<span class="match" aria-live="polite">'+rows.length+' matching endpoint'+(rows.length===1?'':'s')+'</span>'
    +[...state.regions].map(r=>chip('region',r,'Region: '+r)).join('')
    +(state.status==='all'?'':chip('status',state.status,'Configured: '+(state.status==='active'?'Active':'Inactive')))
    +(state.regions.size||state.status!=='all'||state.query?'<button class="link" data-clear>Clear filters</button>':'');
  const pages = Array.from({length:Math.max(3,total)},(_,i)=>i+1);
  section.querySelector('.pagination').innerHTML = '<button aria-label="Previous page" data-page="'+(state.page-1)+'" '+(state.page===1?'disabled':'')+'>‹</button>'
    +pages.map(p=>'<button aria-label="Page '+p+'" data-page="'+p+'" '+(p===state.page?'aria-current="page"':'')+' '+(p>total?'disabled':'')+'>'+p+'</button>').join('')
    +'<button aria-label="Next page" data-page="'+(state.page+1)+'" '+(state.page===total?'disabled':'')+'>›</button>'
    +'<select aria-label="Endpoints per page" data-size>'+[2,3,25,50].map(n=>'<option value="'+n+'" '+(n===state.size?'selected':'')+'>'+n+'/page</option>').join('')+'</select>';
  for (const input of section.querySelectorAll('[data-region]')) input.checked = state.regions.has(input.dataset.region);
  for (const input of section.querySelectorAll('[data-status]')) input.checked = state.status===input.dataset.status;
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.hidden=true,2800);
}
const dialog = $('#dialog');
function openDialog(title,body) {
  dialog.innerHTML = '<header class="dialog-head"><h2 id="dialog-title">'+safe(title)+'</h2><button type="button" data-close class="quiet">Close</button></header><div class="dialog-body">'+body+'</div>';
  if (!dialog.open) dialog.showModal();
  else dialog.querySelector('[data-close]').focus();
}
const fact = (label,value) => '<div class="fact">'+safe(label)+'<strong>'+safe(value)+'</strong></div>';
function inspect(side,row) {
  openDialog(row.name,
    '<p class="meta">'+safe([row.id,side==='supply'?'Supply':'Demand',row.type,row.region].join(' · '))+'</p>'
    +'<div class="facts">'+fact('Configured status',row.active?'On':'Off')+fact('Traffic health','Unavailable')+'</div>'
    +'<h3>Performance</h3><p class="meta">Today 00:00–14:00 UTC · Updated 14:00 UTC</p>'
    +'<div class="facts three">'+fact('Incoming QPS',number(row.qps))+fact('Fill rate',rate(row.fill))+fact('rCPM',money(row.rcpm))+'</div>'
    +'<h3>Continue investigation</h3><div class="dialog-actions"><button class="primary" data-diagnose="Statistics" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Statistics</button><button class="tool" data-diagnose="Loggers" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Loggers</button></div><p class="meta">Pass endpoint, region and period to supported diagnostic routes.</p>');
}
function addEndpoint(side) {
  openDialog('Add '+side+' endpoint','<p class="meta">Demo endpoint. Changes apply to this session.</p><form class="endpoint-form" data-add-form="'+side+'"><label>Name<input name="name" required maxlength="70"></label><label>Type<select name="type">'+types.map(t=>'<option>'+t+'</option>').join('')+'</select></label><label>Region<select name="region">'+regions.map(r=>'<option>'+r+'</option>').join('')+'</select></label><div class="dialog-actions"><button class="primary" type="submit">Add endpoint</button></div></form>');
  dialog.querySelector('input').focus();
}
function exportCsv(side) {
  const data = [['Name','ID','Status','Type','Region','Incoming QPS','Fill rate','Win rate','Render rate','rCPM'],...matching(side).map(r=>[r.name,r.id,r.active?'Active':'Inactive',r.type,r.region,r.qps,r.fill,r.win,r.render,r.rcpm])];
  const csv = data.map(row=>row.map(value=>'"'+String(value??'').replace(/^([=+@-])/,"'$1").replaceAll('"','""')+'"').join(',')).join('\r\n');
  const href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = href;
  link.download = 'attekmi-demo-'+side+'.csv';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
  toast('Demo CSV exported');
}
function closeMenus(except) {
  for (const trigger of document.querySelectorAll('[data-menu][aria-expanded=true]')) {
    if (trigger===except) continue;
    trigger.setAttribute('aria-expanded','false');
    trigger.nextElementSibling.hidden = true;
  }
}
function selectTab(kind,index) {
  if (kind==='traffic') {trafficTab=index;renderTraffic();}
  else {financeTab=index;renderFinance();}
  document.getElementById(kind+'-tab-'+index).focus();
}

document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!event.target.closest('.menu-anchor')) closeMenus();
  if (!button) {
    if (event.target===dialog) dialog.close();
    return;
  }
  const d = button.dataset;
  if (d.close!==undefined) return dialog.close();
  if (d.tab) return selectTab(d.tab,Number(d.index));
  if (d.refresh) {
    times[d.refresh]='14:'+String(++refreshCount[d.refresh]%60).padStart(2,'0');
    updated(d.refresh);
    $('[data-refresh="'+d.refresh+'"]').focus();
    return toast('Demo snapshot refreshed');
  }
  if (button.id==='finance-details') {
    const view = financeViews[financeTab];
    return openDialog(view.name+' comparison','<p class="meta">Demo data · Comparison: 00:00–14:00 UTC</p><div class="facts">'+fact('Today',money(view.today))+fact('Yesterday',money(view.yesterday))+'</div>');
  }
  if (d.diagnose) {
    const row = endpointLists[d.side].find(r=>r.id===d.id);
    return openDialog(d.diagnose+' · Demo','<p class="meta">Illustrative diagnostic context</p><div class="facts">'+fact('Endpoint',row.id)+fact('Region',row.region)+fact('Period','Today 00:00–14:00 UTC')+fact('Source','Test data')+'</div><div class="dialog-actions"><button class="tool" data-inspect="'+safe(row.id)+'" data-side="'+d.side+'">Back to Inspect</button></div>');
  }
  if (d.section) {
    if (d.section==='Dashboard') {window.scrollTo({top:0,behavior:'smooth'});return;}
    return openDialog(d.section,'<p class="meta">This section is outside the demo dashboard flow.</p>');
  }
  const side = button.closest('.endpoints')?.id ?? d.side;
  if (!side) return;
  const state = states[side];
  if (d.menu) {
    const show = button.getAttribute('aria-expanded')!=='true';
    closeMenus(button);
    button.setAttribute('aria-expanded',String(show));
    button.nextElementSibling.hidden=!show;
    return;
  }
  if (d.inspect) return inspect(side,endpointLists[side].find(row=>row.id===d.inspect));
  if (d.add!==undefined) return addEndpoint(side);
  if (d.export!==undefined) return exportCsv(side);
  if (d.expand!==undefined) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('#'+side).requestFullscreen();
    } catch {toast('Fullscreen is unavailable in this browser');}
    return;
  }
  if (d.toggle) {
    const row = endpointLists[side].find(r=>r.id===d.toggle);
    row.active=!row.active;
    toast(row.active?'Demo endpoint enabled':'Demo endpoint disabled');
  } else if (d.sort) {
    state.sort=d.sort;
    state.page=1;
    closeMenus();
  } else if (d.page) state.page=Number(d.page);
  else if (d.chip) {
    if (d.chip==='region') state.regions.delete(d.value);
    else state.status='all';
    state.page=1;
  } else if (d.clear!==undefined) {
    state.regions.clear();state.status='all';state.query='';state.page=1;
    $('#'+side+' input[type=search]').value='';
  } else return;
  renderEndpoints(side);
  if (d.sort) $('#'+side+' [data-menu="sort"]').focus();
});

document.addEventListener('input',event=>{
  const input=event.target;
  if (!input.matches('.search input')) return;
  const side=input.closest('.endpoints').id;
  states[side].query=input.value;states[side].page=1;renderEndpoints(side);
});
document.addEventListener('change',event=>{
  const input=event.target, side=input.closest('.endpoints')?.id;
  if (!side) return;
  const state=states[side], d=input.dataset;
  if (d.region) {
    if (input.checked) state.regions.add(d.region);else state.regions.delete(d.region);
  } else if (d.status) state.status=d.status;
  else if (d.column) {
    if (input.checked) state.hidden.delete(d.column);else state.hidden.add(d.column);
  } else if (d.size!==undefined) state.size=Number(input.value);
  else return;
  state.page=1;renderEndpoints(side);
  if (d.size!==undefined) $('#'+side+' [data-size]').focus();
});
document.addEventListener('submit',event=>{
  const side=event.target.dataset.addForm;
  if (!side) return;
  event.preventDefault();
  const fields = new FormData(event.target);
  const name=String(fields.get('name')).trim();
  if (!name) return;
  const id=(side==='supply'?'SSP':'DSP')+'-DEMO-'+(endpointLists[side].length+1);
  endpointLists[side].unshift({name,id,type:fields.get('type'),region:fields.get('region'),active:true,qps:null,fill:null,win:null,render:null,rcpm:null});
  const state=states[side];
  state.query='';state.regions.clear();state.status='all';state.sort='original';state.page=1;
  $('#'+side+' input[type=search]').value='';
  dialog.close();renderEndpoints(side);toast('Demo endpoint added');
});
document.addEventListener('keydown',event=>{
  const tab=event.target.closest('[data-tab]');
  if (tab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault();
    const i=Number(tab.dataset.index);
    const last=2;
    const next=event.key==='Home'?0:event.key==='End'?last:(i+(event.key==='ArrowRight'?1:last))%(last+1);
    selectTab(tab.dataset.tab,next);
  } else if (event.key==='Escape') {
    const trigger=document.querySelector('[data-menu][aria-expanded=true]');
    if (trigger) {closeMenus();trigger.focus();}
  }
});

renderTraffic();
renderFinance();
initEndpoints('supply');
initEndpoints('demand');
