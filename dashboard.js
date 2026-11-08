'use strict';

const paths = {
  plus: '<path d="M8 2v12M2 8h12"/>',
  close: '<path d="m4 4 8 8m0-8-8 8"/>',
  search: '<circle cx="6.7" cy="6.7" r="4.4"/><path d="m10 10 3.5 3.5"/>',
  filter: '<path d="M2 3h12L9 8v4l-2 1V8z"/>',
  columns: '<path d="M0 2h7m2 0h7M0 6h7m2 0h7M0 10h7m2 0h7M0 14h7m2 0h7"/>',
  external: '<path d="M3 12 12 3M6 3h6v6M2 14h12"/>',
  refresh: '<path d="M13 6a5.5 5.5 0 1 0-1 6M13 2v4H9"/>',
  info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5m0-6h.01"/>',
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
const endpointLists = {
  supply: [
    ['Northstar Video Supply','SSP-1042','RTB','APAC',3846,78.2,36.4,91.7,2.84,3612],
    ['Northstar Video Supply · US','SSP-1186','VAST','US_EAST',1436,63.9,28.1,88.3,2.32,1318],
    ['Open Media Exchange','SSP-1204','Prebid','EU',2445,72.4,31.6,93.1,2.61,2320],
    ['Vista Streaming Network','SSP-1215','RTB','EU',null,null,null,null,null,null],
    ['Harbor Test Supply','SSP-1232','RTB','APAC',0,null,null,null,null,null,false],
  ].map(([name,id,type,region,qps,fill,win,render,rcpm,validIncoming,active=true])=>({name,id,type,region,qps,fill,win,render,rcpm,validIncoming,active})),
  demand: [
    ['Meridian Demand','DSP-3056','RTB','US_EAST',5210,1303,0.294,0.008,3120.40],
    ['Skyline Programmatic','DSP-3071','VAST','US_EAST',3385,880,0.271,0.014,1880.25],
    ['Vector Media Buying','DSP-3012','RTB','APAC',6120,1285,0.348,0.068,3640.10],
    ['Lotus Ad Network','DSP-3088','RTB','APAC',3756,977,0.302,0.021,1590.30],
    ['Atlas Video Exchange','DSP-3140','VAST','EU',4150,1079,0.308,0.011,1420.55],
    ['Nordic Bid Hub','DSP-3102','Prebid','EU',2613,627,0.289,0.004,950.73],
    ['Orion Digital Demand','DSP-3199','RTB','EU',null,null,null,null,null],
  ].map(([name,id,type,region,outgoing,bids,winRate,timeoutRate,spend])=>({name,id,type,region,outgoing,bids,winRate,timeoutRate,spend,active:true})),
};
const demandOptional = [
  ['fill','Fill rate',8.2,'num'],['render','Render rate',8.6,'num'],['rcpm','rCPM',9,'num'],
  ['validBid','Valid bid rate',10,'num'],['spendLimit','Spend limit',10,'num'],['margin','Margin',8,'num'],
  ['email','Email',13],['comment','Comment',14],
];
const states = Object.fromEntries(['supply','demand'].map(side => [side, {query:'',regions:new Set(side==='demand'?regions:[]),status:'active',sort:'original',size:25,page:1,hidden:new Set(side==='demand'?demandOptional.map(([key])=>key):['validIncoming'])}]));
const endpointColumns = {
  supply: [
    ['name','Name / ID',20.65],['status','Status',10.2],['type','Type',7],['region','Region',8],
    ['qps','Incoming QPS',9.15,'num'],['validRate','Valid rate',10.5,'num'],['validIncoming','Valid QPS',9.15,'num'],['fill','Fill rate',8.2,'num'],['win','Win rate',8,'num'],
    ['render','Render rate',8.6,'num'],['rcpm','rCPM',9,'num'],['details','Details',10.2],
  ],
  demand: [
    ['status','Status',8.5],['name','Name / ID',20.65],['type','Type',7],['region','Region',8],
    ['outgoing','Outgoing QPS',14,'num'],['bid','Bid rate',10.5,'num'],['win','Win rate',10.5,'num'],
    ['timeout','Timeout rate',14,'num'],['spend','Spend today',13,'num'],...demandOptional,['details','Details',10.2],
  ],
};
const metricDefinitions = {
  supply: {validRate:"Valid QPS ÷ Incoming QPS. The exact definition of 'valid' is being confirmed."},
  demand: {
    outgoing:'Requests the exchange sends to this DSP per second.',
    bid:'Bids ÷ Outgoing QPS.',
    win:'Wins ÷ bids. The definition varies between platforms and is being confirmed.',
    timeout:'Share of requests the DSP did not answer in time.',
    spend:'Meaning of spend on the demand side is being confirmed.',
  },
};
const regionalTraffic = [
  ['US_EAST',1436,1318,8595,20000,true],['APAC',3846,3612,9876,10000],['EU',2445,2320,6763,10000],
];
const regionalIncoming = new Map(regionalTraffic.map(([region,incoming])=>[region,incoming]));
const regionalOutgoing = new Map(regionalTraffic.map(([region,,,outgoing])=>[region,outgoing]));
const percentFormat = new Intl.NumberFormat('en-US',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});
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
  {name:'DSP Spend',today:endpointLists.demand.reduce((sum,row)=>sum+(row.spend??0),0),yesterday:5748.29},
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
function utilization(value,limit,tooltipId) {
  if (!limit) return '';
  const percent = (value / limit * 100).toFixed(2);
  if (value / limit < .95) return '<span class="badge">'+percent+'%</span>';

  const headroom = limit-value;
  const risk = headroom<0?'Over limit · '+number(-headroom)+' req/s above plan limit':
    headroom===0?'Plan limit reached · 0 req/s headroom':
    'Approaching limit · '+number(headroom)+' req/s headroom';
  return metricTooltip(tooltipId,percent+'%'+icon('warning'),risk,'badge warning');
}
function metricTooltip(id,label,description,triggerClass,triggerLabel='',assumed=false) {
  const definition = triggerLabel?' role="img" aria-label="'+triggerLabel+'"':'';
  return '<span class="limit-tip'+(triggerLabel?' definition-tip':'')+'"><span class="'+triggerClass+'" tabindex="0" aria-describedby="'+id+'"'+definition+'>'+label+'</span>'
    +'<span class="limit-tooltip" id="'+id+'" role="tooltip"><span class="tooltip-content">'+(assumed?'<span class="assumption-pill">Assumption</span> ':'')+safe(description)+'</span></span></span>';
}
function bindTooltipDismissal(container) {
  for (const tip of container.querySelectorAll('.limit-tip')) {
    const resetDismissal = () => {
      if (!tip.matches(':hover, :focus-within')) tip.removeAttribute('data-dismissed');
    };
    tip.addEventListener('pointerleave',resetDismissal);
    tip.addEventListener('focusout',() => queueMicrotask(resetDismissal));
  }
}
function updated(kind) {
  $('#'+kind+'-updated').innerHTML = 'Updated '+times[kind]+' UTC <button data-refresh="'+kind+'" aria-label="Refresh '+(kind==='traffic'?'traffic overview':'financial comparison')+'">'+icon('refresh')+'</button>';
}
function renderTraffic() {
  const view = trafficViews[trafficTab];
  tabs('traffic',trafficViews,trafficTab);
  const content = $('#traffic-content');
  content.innerHTML = '<table class="summary"><colgroup><col style="width:16.67%"><col style="width:20.65%"><col style="width:22.25%"><col style="width:20.3%"><col></colgroup><thead><tr><th scope="col">'+view.first+'</th><th scope="col">Incoming QPS</th><th scope="col">Valid Incoming QPS</th><th scope="col">Outgoing QPS</th><th scope="col">Plan Limit</th></tr></thead><tbody>'+view.rows.map(([name,incoming,valid,outgoing,limit,main],index) =>
    '<tr><td>'+name+(main?'<span class="badge neutral">Main</span>':'')+'</td><td>'+number(incoming)+utilization(incoming,limit,'incoming-risk-'+index)+'</td><td>'+number(valid)+'</td><td>'+number(outgoing)+utilization(outgoing,limit,'outgoing-risk-'+index)+'</td><td>'+number(limit)+'</td></tr>').join('')+'</tbody></table>';
  bindTooltipDismissal(content);
  updated('traffic');
}
function renderFinance() {
  const {today,yesterday} = financeViews[financeTab];
  const delta = today-yesterday;
  tabs('finance',financeViews,financeTab);
  $('#finance-content').innerHTML = '<div class="finance-cards"><div class="finance-card">Today<strong>'+money(today)+'</strong></div><div class="finance-card">Yesterday<strong>'+money(yesterday)+'</strong></div></div><div class="finance-delta"><span class="badge">+'+(delta/yesterday*100).toFixed(2)+'%</span><span>+'+money(delta)+' vs yesterday</span></div>';
  updated('finance');
}

function menuButton(action,text,content,classes,leading,placement='') {
  return '<div class="menu-anchor"><button class="'+classes+'" data-menu="'+action+'" aria-expanded="false">'+leading+text+'<span class="trailing">'+icon('chevron')+'</span></button><div class="menu'+(placement?' '+placement:'')+'" hidden>'+content+'</div></div>';
}
function initEndpoints(side) {
  const section = $('#'+side);
  const title = side==='supply'?'Supply Side':'Demand Side';
  const [on,off] = statusLabels(side);
  const filterItems = '<strong>Region</strong>'+regions.map(r => '<label><input type="checkbox" data-region="'+r+'">'+r+'</label>').join('')+'<strong>Configured status</strong>'+[['all','Any status'],['active',on],['inactive',off]].map(([value,label])=>'<label><input type="radio" name="'+side+'-status" data-status="'+value+'">'+label+'</label>').join('');
  const columnItems = '<strong>Visible columns</strong>'+endpointColumns[side].filter(([key])=>key!=='name'&&key!=='details').map(([key,label])=>'<label><input type="checkbox" data-column="'+key+'"'+(states[side].hidden.has(key)?'':' checked')+'>'+label+'</label>').join('');
  const columnsMenu = menuButton('columns','Columns',columnItems,'tool',icon('columns'),'right');
  section.innerHTML = '<header class="endpoint-head"><button class="primary add" data-add aria-label="Add '+side+' endpoint">'+icon('plus')+'</button><h2 id="'+side+'-title">'+title+'</h2>'+(side==='demand'?'<span class="badge neutral demo-label">Demo data</span>':'')+'<div class="tools">'+columnsMenu+'<button class="quiet export" data-export>Export '+icon('download')+'</button><button class="quiet icon-button" data-expand aria-label="Expand '+title+'">'+icon('expand')+'</button></div></header>'
    +'<div class="controls"><label class="search">'+icon('search')+'<input type="search" placeholder="Search by name or ID" aria-label="Search '+side+' by name or ID"><span class="trailing">'+icon('chevron')+'</span></label>'+menuButton('filter','Filter',filterItems,'select-button',icon('filter'))+'<span class="sort-summary" role="status"></span></div>'
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
  if (state.sort!=='original') {
    const key = state.sort;
    rows.sort((a,b)=>{
      const first = metricValue(a,key);
      const second = metricValue(b,key);
      if (first==null) return second==null?0:1;
      if (second==null) return -1;
      const comparison = typeof first==='string'?first.localeCompare(second):first-second;
      return state.direction==='ascending'?comparison:-comparison;
    });
  }
  return rows;
}
function statusLabels(side) {
  return side==='supply'?['Active','Inactive']:['On','Off'];
}
function ratio(value,total) {
  return value==null || !(total>0)?null:value/total;
}
function percentage(value) {
  return value==null?'—':percentFormat.format(value);
}
function metricValue(row,key) {
  switch (key) {
    case 'status': return Number(!row.active);
    case 'validRate': return ratio(row.validIncoming,row.qps);
    case 'bid': return ratio(row.bids,row.outgoing);
    case 'win': return row.winRate ?? row.win;
    case 'timeout': return row.timeoutRate;
    default: return row[key];
  }
}
function qpsCell(value,total,showBar=false) {
  const share = ratio(value,total);
  const bar = showBar && share!==null?'<span class="share-bar" aria-hidden="true"><span style="width:'+Math.min(100,share*100)+'%"></span></span>':'';
  return number(value)+'<span class="endpoint-id load-share">'+(share===null?'Share unavailable':percentage(share)+' of region')+'</span>'+bar;
}

function rowCell(key,row,side) {
  const id = safe(row.id);
  const name = safe(row.name);
  const [on,off] = statusLabels(side);
  const cells = {
    name:'<button class="link endpoint-name" data-inspect="'+id+'" title="'+name+'">'+name+'</button><span class="endpoint-id" title="'+id+'">'+id+'</span>',
    status:'<button class="status-switch" role="switch" aria-checked="'+row.active+'" aria-label="'+name+', '+(row.active?on:off)+'" data-toggle="'+id+'"><span class="switch-track"></span>'+(row.active?on:off)+'</button>',
    type:safe(row.type),region:safe(row.region),
    qps:qpsCell(row.qps,regionalIncoming.get(row.region)),
    validRate:percentage(metricValue(row,'validRate')),validIncoming:number(row.validIncoming),
    outgoing:qpsCell(row.outgoing,regionalOutgoing.get(row.region),true),
    bid:percentage(metricValue(row,'bid')),win:side==='demand'?percentage(row.winRate):rate(row.win),spend:money(row.spend),
    timeout:row.timeoutRate>0.05?metricTooltip('timeout-'+id,percentage(row.timeoutRate)+icon('warning')+'High','Illustrative threshold, not a platform rule','badge warning timeout-badge','',true):percentage(row.timeoutRate),
    fill:rate(row.fill),render:rate(row.render),rcpm:money(row.rcpm),validBid:rate(row.validBid),
    spendLimit:money(row.spendLimit),margin:rate(row.margin),email:safe(row.email??'—'),comment:safe(row.comment??'—'),
    details:'<button class="quiet inspect" data-inspect="'+id+'" aria-label="Inspect '+name+'">Inspect</button>',
  };
  return cells[key];
}
function renderEndpoints(side) {
  const state = states[side], section = $('#'+side), rows = matching(side);
  const total = Math.max(1,Math.ceil(rows.length/state.size));
  state.page = Math.min(total,Math.max(1,state.page));
  const shown = rows.slice((state.page-1)*state.size,state.page*state.size);
  const visible = endpointColumns[side].filter(([key])=>!state.hidden.has(key));
  const direction = state.sort==='original'?null:state.direction;
  const arrow = direction==='ascending'?'↑':'↓';
  const sortedLabel = endpointColumns[side].find(([key])=>key===state.sort)?.[1];
  const sortSummary = section.querySelector('.sort-summary');
  const sortText = direction?'Sort: '+sortedLabel+' '+arrow:'Sort by column header';
  if (sortSummary.textContent!==sortText) sortSummary.textContent=sortText;
  const scrollWeight = visible.reduce((sum,[key,,width])=>sum+(key==='name'?0:width),0);
  const table = section.querySelector('table');
  table.style.setProperty('--scroll-weight',scrollWeight);
  const columnWidths = visible.map(([key,,width])=>{
    return key==='name'?'var(--pinned-column)':'calc((var(--table-width) - var(--pinned-column)) * '+(width/scrollWeight)+')';
  });
  table.innerHTML = '<colgroup>'+columnWidths.map(width=>'<col style="width:'+width+'">').join('')+'</colgroup><thead><tr>'+visible.map(([key,label,,align])=>{
    const active = direction && key===state.sort;
    const indicator = '<span class="sort-indicator" aria-hidden="true">'+(active?arrow:'↕')+'</span>';
    const content = key!=='details'
      ? '<button class="column-sort" data-sort-column="'+key+'" aria-label="'+label+', sort '+(active&&direction==='ascending'?'descending':'ascending')+'">'+label+indicator+'</button>'
      : label;
    const definition = metricDefinitions[side][key];
    const info = definition?metricTooltip(side+'-definition-'+key,icon('info'),definition,'metric-info',label+' definition',true):'';
    return '<th scope="col" class="'+[align,key==='name'?'pinned-name':''].filter(Boolean).join(' ')+'"'+(key==='details'?'':' aria-sort="'+(active?direction:'none')+'"')+'>'+info+content+'</th>';
  }).join('')+'</tr></thead><tbody>'
    +(shown.length?shown.map(row=>'<tr>'+visible.map(([key,,,align])=>'<td class="'+[align,key==='name'?'pinned-name':''].filter(Boolean).join(' ')+'">'+rowCell(key,row,side)+'</td>').join('')+'</tr>').join(''):'<tr><td class="empty" colspan="'+visible.length+'">No matching endpoints</td></tr>')+'</tbody>';
  bindTooltipDismissal(table);
  const [on,off] = statusLabels(side);
  const chip = (key,value,label) => '<button class="chip" data-chip="'+key+'" data-value="'+safe(value)+'" aria-label="Remove '+safe(label)+' filter">'+safe(label)+icon('close')+'</button>';
  section.querySelector('.applied').innerHTML = '<span class="match" aria-live="polite">'+rows.length+' matching endpoint'+(rows.length===1?'':'s')+'</span>'
    +(side==='demand' && state.regions.size===regions.length?chip('all-regions','','Region: All ('+regions.length+')'):[...state.regions].map(r=>chip('region',r,'Region: '+r)).join(''))
    +(state.status==='all'?'':chip('status',state.status,'Configured: '+(state.status==='active'?on:off)))
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
  const performance = side==='supply'
    ? fact('Incoming QPS',number(row.qps))+fact('Fill rate',rate(row.fill))+fact('rCPM',money(row.rcpm))
    : fact('Outgoing QPS',number(row.outgoing))+fact('Bid rate',percentage(metricValue(row,'bid')))+fact('Spend today',money(row.spend));
  openDialog(row.name,
    '<p class="meta">'+safe([row.id,side==='supply'?'Supply':'Demand',row.type,row.region].join(' · '))+'</p>'
    +'<div class="facts">'+fact('Configured status',row.active?'On':'Off')+fact('Traffic health','Unavailable')+'</div>'
    +'<h3>Performance</h3><p class="meta">Today 00:00–14:00 UTC · Updated 14:00 UTC</p>'
    +'<div class="facts three">'+performance+'</div>'
    +'<h3>Continue investigation</h3><div class="dialog-actions"><button class="primary" data-diagnose="Statistics" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Statistics</button><button class="tool" data-diagnose="Loggers" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Loggers</button></div><p class="meta">Pass endpoint, region and period to supported diagnostic routes.</p>');
}
function addEndpoint(side) {
  openDialog('Add '+side+' endpoint','<p class="meta">Demo endpoint. Changes apply to this session.</p><form class="endpoint-form" data-add-form="'+side+'"><label>Name<input name="name" required maxlength="70"></label><label>Type<select name="type">'+types.map(t=>'<option>'+t+'</option>').join('')+'</select></label><label>Region<select name="region">'+regions.map(r=>'<option>'+r+'</option>').join('')+'</select></label><div class="dialog-actions"><button class="primary" type="submit">Add endpoint</button></div></form>');
  dialog.querySelector('input').focus();
}
function exportCsv(side) {
  const [on,off] = statusLabels(side);
  const rows = matching(side);
  const data = side==='supply'
    ? [['Name','ID','Status','Type','Region','Incoming QPS','Valid rate','Valid QPS','Fill rate','Win rate','Render rate','rCPM'],...rows.map(r=>[r.name,r.id,r.active?on:off,r.type,r.region,r.qps,metricValue(r,'validRate')==null?null:percentage(metricValue(r,'validRate')),r.validIncoming,r.fill,r.win,r.render,r.rcpm])]
    : [['Name','ID','Status','Type','Region','Outgoing QPS','% of region','Bid rate','Win rate','Timeout rate','Spend today'],...rows.map(r=>[r.name,r.id,r.active?on:off,r.type,r.region,r.outgoing,ratio(r.outgoing,regionalOutgoing.get(r.region))==null?null:percentage(ratio(r.outgoing,regionalOutgoing.get(r.region))),r.bids==null?null:percentage(metricValue(r,'bid')),r.winRate==null?null:percentage(r.winRate),r.timeoutRate==null?null:percentage(r.timeoutRate),r.spend])];
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
  } else if (d.sortColumn) {
    state.direction=state.sort===d.sortColumn && state.direction==='ascending'?'descending':'ascending';
    state.sort=d.sortColumn;
    state.page=1;
  } else if (d.page) state.page=Number(d.page);
  else if (d.chip) {
    if (d.chip==='region') state.regions.delete(d.value);
    else if (d.chip==='all-regions') state.regions.clear();
    else state.status='all';
    state.page=1;
  } else if (d.clear!==undefined) {
    state.regions.clear();state.status='all';state.query='';state.page=1;
    $('#'+side+' input[type=search]').value='';
  } else return;
  renderEndpoints(side);
  if (d.sortColumn) $('#'+side+' [data-sort-column="'+d.sortColumn+'"]').focus({preventScroll:true});
  if (d.toggle) {
    const toggle = [...$('#'+side).querySelectorAll('[data-toggle]')].find(control=>control.dataset.toggle===d.toggle);
    (toggle ?? $('#'+side+' [data-menu="filter"]')).focus({preventScroll:true});
  }
  if (d.page) $('#'+side+' [aria-current="page"]').focus({preventScroll:true});
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
    const tip = document.querySelector('.limit-tip:not([data-dismissed]):is(:hover, :focus-within)');
    if (tip) tip.setAttribute('data-dismissed','');
    const trigger=document.querySelector('[data-menu][aria-expanded=true]');
    if (trigger) {closeMenus();trigger.focus();}
  }
});

renderTraffic();
renderFinance();
initEndpoints('supply');
initEndpoints('demand');

if (['127.0.0.1','localhost'].includes(location.hostname) && new URLSearchParams(location.search).has('check')) {
  const assert = (condition,message) => {if (!condition) throw Error('Demo check: '+message);};
  for (const [region,total] of regionalOutgoing) {
    const rows = endpointLists.demand.filter(row=>row.region===region && row.outgoing!=null);
    assert(rows.reduce((sum,row)=>sum+row.outgoing,0)===total,region+' outgoing total');
    const shareSum = rows.reduce((sum,row)=>sum+parseFloat(percentage(ratio(row.outgoing,total))),0);
    assert(Math.abs(shareSum-100)<=0.100001,region+' displayed shares');
  }
  const expectedValidRates = new Map([
    ['SSP-1042','93.9%'],['SSP-1186','91.8%'],['SSP-1204','94.9%'],['SSP-1215','—'],
  ]);
  for (const row of endpointLists.supply) {
    const expected = expectedValidRates.get(row.id);
    if (expected) assert(percentage(metricValue(row,'validRate'))===expected,row.id+' valid rate');
  }
  const us = regionalTraffic.find(([region])=>region==='US_EAST');
  const apac = regionalTraffic.find(([region])=>region==='APAC');
  assert(utilization(us[1],us[4],'check-us').includes('7.18%'),'US_EAST incoming plan utilization');
  assert(utilization(apac[3],apac[4],'check-apac').includes('98.76%'),'APAC outgoing plan utilization');
  console.info('Demo data checks passed');
}
