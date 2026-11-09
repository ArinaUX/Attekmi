'use strict';

const paths = {
  plus: '<path d="M8 2v12M2 8h12"/>',
  check: '<path d="m3 8 3 3 7-7"/>',
  close: '<path d="m4 4 8 8m0-8-8 8"/>',
  search: '<circle cx="6.7" cy="6.7" r="4.4"/><path d="m10 10 3.5 3.5"/>',
  pageChevron: '<path d="m6 3 5 5-5 5"/>',
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
const statusLabels = ['On','Off'];
const unsortableColumns = new Set(['type','region','email','comment','percent']);
const lockedColumns = new Set(['name','status']);
const identityColumns = [
  ['name','Name / ID',190],['status','Status',94],['type','Type',100],['adFormats','Ad Formats'],['region','Region',88],
];
const fixedColumnKeys = new Set(['type','region']);
const qualityOptional = [['render','Render Rate',11,'num'],['validBid','Valid BID Rate',13,'num']];
const configurationColumns = [
  ['spendLimit','Spend Limit',11,'num'],['margin','Margin',9,'num'],
];
const contactColumns = [['email','E-mail',14],['comment','Comment',15]];
const endpointGroups = {
  supply: [
    ['Identity',identityColumns],
    ['Traffic',[['qps','Incoming QPS',14,'num'],['validIncoming','Valid QPS',12,'num'],['bids','BID QPS',11,'num']]],
    ['Quality',[['fill','Fill Rate',11,'num'],['win','WIN Rate',11,'num'],...qualityOptional,['percent','%',9,'num']]],
    ['Money',[['rcpm','SSP RCPM',12,'num'],['spend','Daily Spend',12,'num'],...configurationColumns]],
    ['Contact & notes',contactColumns],
  ],
  demand: [
    ['Identity',identityColumns],
    ['Traffic',[['outgoing','Outgoing QPS',14,'num'],['bids','BID QPS',11,'num']]],
    ['Quality',[['win','WIN Rate',11,'num'],['timeout','Timeout rate',14,'num'],['fill','Fill Rate',11,'num'],...qualityOptional]],
    ['Money',[['spend','Daily Spend',12,'num'],['rcpm','rCPM',10,'num'],...configurationColumns]],
    ['Contact & notes',contactColumns],
  ],
};
const endpointColumns = Object.fromEntries(Object.entries(endpointGroups).map(([side,groups])=>[side,groups.flatMap(([,columns])=>columns)]));
const defaultHiddenColumns = {
  supply:['bids','render','validBid','percent','spendLimit','margin','email','comment'],
  demand:['fill','render','validBid','rcpm','spendLimit','margin','email','comment'],
};
const states = Object.fromEntries(['supply','demand'].map(side => [side, {query:'',regions:new Set(),types:new Set(),sort:'original',size:25,page:1,hidden:new Set(defaultHiddenColumns[side])}]));
const metricDefinitions = {
  qps:'Requests received from this SSP per second. The secondary value is this endpoint’s share of regional Incoming QPS.',
  validIncoming:'Incoming requests that pass validation per second. The secondary value is Valid QPS ÷ Incoming QPS. The validation criteria are unconfirmed.',
  outgoing:'Requests sent to this DSP per second. The secondary value is this endpoint’s share of regional Outgoing QPS.',
  bids:'Bid responses per second.',
  fill:'Share of opportunities that result in an ad being filled. The denominator is unconfirmed.',
  win:'Share of bids that win. The denominator is unconfirmed.',
  timeout:'Share of requests that did not receive a response in time. Platform availability and the timeout window are unconfirmed.',
  render:'Share of ads that render. The denominator is unconfirmed.',
  validBid:'Share of bids that pass validation. The denominator and validation criteria are unconfirmed.',
  percent:'The metric and its denominator are unconfirmed.',
  rcpm:'Revenue per thousand events. The event counted is unconfirmed.',
  spend:'Spend attributed to this endpoint today. The reporting window is unconfirmed.',
  spendLimit:'Configured maximum spend. The period and enforcement are unconfirmed.',
  margin:'Share of spend retained as margin. The formula is unconfirmed.',
};
const sampleFormats = new Map([
  ['SSP-1042','Video'],['SSP-1186','Video'],['SSP-1204','Display, Native'],['SSP-1215','Video'],['SSP-1232','Display'],
  ['DSP-3056','Display, Video'],['DSP-3071','Video'],['DSP-3012','Video, Display'],['DSP-3088','Display'],
  ['DSP-3140','Video'],['DSP-3102','Display, Native'],['DSP-3199','Display'],
]);
const sampleSupplySpend = new Map([['SSP-1042',2480.30],['SSP-1186',780.20],['SSP-1204',919.74]]);
const regionalTraffic = [
  ['US_EAST',1436,1318,8595,20000,true],['APAC',3846,3612,9876,10000],['EU',2445,2320,6763,10000],
];
const regionalIncoming = new Map(regionalTraffic.map(([region,incoming])=>[region,incoming]));
const regionalOutgoing = new Map(regionalTraffic.map(([region,,,outgoing])=>[region,outgoing]));
const percentFormat = new Intl.NumberFormat('en-US',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});
const trafficViews = [
  {name:'Regions',icon:'region'},
  {name:'Traffic Types',icon:'statistics'},
  {name:'Ad Formats',icon:'format'},
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
  ['settings','frameworks','integrations','traffic','funds','companies','mismatches'],
  ['account','support','knowledge','notification','exit'],
  ['panel'],
];
$('#sidebar').innerHTML = utilities.map(group => '<div class="group">'+group.map(asset => '<span class="sidebar-item">'+icon(asset)+(asset==='notification'?'<span class="counter">0</span>':'')+'</span>').join('')+'</div>').join('');
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
    +'<span class="limit-tooltip" id="'+id+'" role="tooltip" popover="manual"><span class="tooltip-content">'+(assumed?'<span class="assumption-pill">Assumption</span> ':'')+safe(description)+'</span></span></span>';
}
let activeTip;
function positionTooltip(tip) {
  const trigger = tip.firstElementChild.getBoundingClientRect();
  const tooltip = tip.lastElementChild;
  const box = tooltip.getBoundingClientRect();
  const shell = tip.closest('.table-scroll')?.getBoundingClientRect();
  if (trigger.right<0 || trigger.left>document.documentElement.clientWidth || trigger.bottom<0 || trigger.top>window.innerHeight
    || (shell && (trigger.left<shell.left || trigger.right>shell.right))) {
    tooltip.hidePopover();
    activeTip = undefined;
    return;
  }
  const left = Math.max(8,Math.min(trigger.left,document.documentElement.clientWidth-box.width-8));
  const top = trigger.bottom+box.height<=window.innerHeight-8 ? trigger.bottom : trigger.top-box.height;
  tooltip.style.left = left+'px';
  tooltip.style.top = Math.max(8,top)+'px';
}
function bindTooltipDismissal(container) {
  for (const tip of container.querySelectorAll('.limit-tip')) {
    const tooltip = tip.lastElementChild;
    const show = () => {
      if (tip.hasAttribute('data-dismissed')) return;
      if (activeTip && activeTip!==tip) activeTip.lastElementChild.hidePopover();
      activeTip = tip;
      tooltip.showPopover();
      positionTooltip(tip);
    };
    const resetDismissal = () => {
      if (tip.matches(':hover, :focus-within') || tooltip.matches(':hover')) return;
      tip.removeAttribute('data-dismissed');
      tooltip.hidePopover();
      if (activeTip===tip) activeTip = undefined;
    };
    tip.addEventListener('pointerenter',show);
    tip.addEventListener('focusin',show);
    tip.addEventListener('pointerleave',()=>requestAnimationFrame(resetDismissal));
    tip.addEventListener('focusout',()=>queueMicrotask(resetDismissal));
    tooltip.addEventListener('pointerleave',()=>requestAnimationFrame(resetDismissal));
  }
}
function updateTooltipPosition() {
  if (activeTip?.isConnected) positionTooltip(activeTip);
  else activeTip = undefined;
}
document.addEventListener('scroll',updateTooltipPosition,true);
window.addEventListener('resize',updateTooltipPosition);
function updated(kind) {
  $('#'+kind+'-updated').innerHTML = 'Updated '+times[kind]+' UTC <button data-refresh="'+kind+'" aria-label="Refresh '+(kind==='traffic'?'traffic overview':'financial comparison')+'">'+icon('refresh')+'</button>';
}
function renderTraffic() {
  tabs('traffic',trafficViews,trafficTab);
  const content = $('#traffic-content');
  const hasData = trafficTab===0;
  $('#traffic-foot').hidden = !hasData;
  if (!hasData) {
    content.innerHTML = '<p class="traffic-placeholder">No data and design</p>';
    return;
  }
  content.innerHTML = '<table class="summary"><colgroup><col style="width:16.67%"><col style="width:20.65%"><col style="width:22.25%"><col style="width:20.3%"><col></colgroup><thead><tr><th scope="col">Region</th><th scope="col">Incoming QPS</th><th scope="col">Valid Incoming QPS</th><th scope="col">Outgoing QPS</th><th scope="col">Plan Limit</th></tr></thead><tbody>'+regionalTraffic.map(([name,incoming,valid,outgoing,limit,main],index) =>
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
  const filterItems = '<strong>Region</strong>'+regions.map(region=>'<label><input type="checkbox" data-region="'+region+'">'+region+'</label>').join('')
    +'<strong>Type</strong>'+(side==='supply'?supplyConnectionTypes:types).map(type=>'<label><input type="checkbox" data-type="'+type+'">'+type+'</label>').join('');
  const columnItems = '<div class="column-menu-head"><strong>Visible columns</strong><button type="button" class="reset-columns" data-reset-columns>'+icon('refresh')+'Reset to default</button></div><div class="column-menu-groups">'
    +endpointGroups[side].map(([group,columns])=>'<fieldset><legend>'+group+'</legend>'
      +columns.map(([key,label])=>'<label><input type="checkbox" data-column="'+key+'"'+(lockedColumns.has(key)?' disabled':'')+'>'+label+'</label>').join('')
      +'</fieldset>').join('')+'</div>';
  const columnsMenu = menuButton('columns','Columns',columnItems,'tool',icon('columns'),'right');
  section.innerHTML = '<header class="endpoint-head"><button class="primary add" data-add aria-label="Endoint, add '+side+' endpoint">'+icon('plus')+'Endoint</button><h2 id="'+side+'-title">'+title+'</h2><span class="badge neutral demo-label">Demo data</span><div class="tools">'+columnsMenu+'<button class="quiet export" data-export>Export '+icon('download')+'</button><button class="quiet icon-button" data-expand aria-label="Expand '+title+'">'+icon('expand')+'</button></div></header>'
    +'<div class="controls"><label class="search">'+icon('search')+'<input type="search" placeholder="Search by name or ID" aria-label="Search '+side+' by name or ID"></label>'+menuButton('filter','Filter',filterItems,'select-button',icon('filter'))+'<span class="sort-summary" role="status"></span></div>'
    +'<div class="applied"></div><div class="table-scroll table-shell"><table class="endpoint-table" aria-label="'+title+' endpoints"></table></div><nav class="pagination" aria-label="'+title+' pagination"></nav>';
  renderEndpoints(side);
}

function matching(side) {
  const state = states[side];
  const query = state.query.trim().toLowerCase();
  const rows = endpointLists[side].filter(row =>
    (!query || (row.name+' '+row.id).toLowerCase().includes(query)) &&
    (!state.regions.size || state.regions.has(row.region)) &&
    (!state.types.size || state.types.has(row.type)));
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
function ratio(value,total) {
  return value==null || !(total>0)?null:value/total;
}
function percentage(value) {
  return value==null?'—':percentFormat.format(value);
}
function metricValue(row,key) {
  switch (key) {
    case 'status': return Number(!row.active);
    case 'win': return row.winRate ?? row.win;
    case 'timeout': return row.timeoutRate;
    case 'spend': return row.spend ?? sampleSupplySpend.get(row.id);
    default: return row[key];
  }
}
function qpsCell(key,row,showBar=false) {
  const [share,label] = endpointShare(key,row);
  const bar = showBar && share!==null?'<span class="share-bar" aria-hidden="true"><span style="width:'+Math.min(100,share*100)+'%"></span></span>':'';
  return number(row[key])+secondary(share===null?'Share unavailable':percentage(share)+' '+label)+bar;
}

const secondary = value => '<span class="endpoint-id load-share">'+safe(value)+'</span>';
function metricText(key,row,side) {
  switch (key) {
    case 'status': return row.active?statusLabels[0]:statusLabels[1];
    case 'adFormats': return row.formats?.join(', ') || sampleFormats.get(row.id) || '—';
    case 'qps': case 'validIncoming': case 'outgoing': case 'bids': return number(row[key]);
    case 'win': return side==='demand'?percentage(row.winRate):rate(row.win);
    case 'timeout': return percentage(row.timeoutRate)+(row.timeoutRate>0.05?' · High':'');
    case 'fill': case 'render': case 'validBid': case 'margin': case 'percent': return rate(row[key]);
    case 'rcpm': case 'spend': case 'spendLimit': return money(metricValue(row,key));
    default: return row[key] ?? '—';
  }
}
function rowCell(key,row,side) {
  const id = safe(row.id);
  const name = safe(row.name);
  const value = metricText(key,row,side);
  switch (key) {
    case 'name': return '<button class="link endpoint-name" data-inspect="'+id+'" aria-haspopup="dialog" title="'+name+'">'+name+'</button><span class="endpoint-id" title="'+id+'">'+id+'</span>';
    case 'status': return '<button class="status-switch" role="switch" aria-checked="'+row.active+'" aria-label="'+name+', '+value+'" data-toggle="'+id+'"><span class="switch-track"></span>'+value+'</button>';
    case 'type': {
      const hidden = states[side].hidden;
      return (hidden.has('type')?'':safe(value))+(hidden.has('adFormats')?'':secondary(metricText('adFormats',row,side)));
    }
    case 'qps': return qpsCell(key,row);
    case 'validIncoming': return qpsCell(key,row);
    case 'outgoing': return qpsCell(key,row,true);
    case 'bids': return side==='demand'?qpsCell(key,row):safe(value);
    case 'timeout': return row.timeoutRate>0.05?metricTooltip('timeout-'+id,percentage(row.timeoutRate)+icon('warning')+'High','Illustrative threshold, not a platform rule','badge warning timeout-badge','',true):safe(value);
    default: return safe(value);
  }
}
function renderEndpoints(side) {
  const state = states[side], section = $('#'+side), rows = matching(side);
  const total = Math.max(1,Math.ceil(rows.length/state.size));
  state.page = Math.min(total,Math.max(1,state.page));
  const start = (state.page-1)*state.size;
  const shown = rows.slice(start,start+state.size);
  const visible = endpointColumns[side].filter(([key])=>key==='type'
    ? !state.hidden.has('type') || !state.hidden.has('adFormats')
    : key!=='adFormats' && !state.hidden.has(key));
  const direction = state.sort==='original'?null:state.direction;
  const arrow = direction==='ascending'?'↑':'↓';
  const sortedLabel = endpointColumns[side].find(([key])=>key===state.sort)?.[1];
  const sortSummary = section.querySelector('.sort-summary');
  const sortText = direction?'Sort: '+sortedLabel+' '+arrow:'';
  if (sortSummary.textContent!==sortText) sortSummary.textContent=sortText;
  const fixedWidth = visible.reduce((sum,[key,,width])=>sum+(fixedColumnKeys.has(key)?width:0),0);
  const scrollWeight = visible.reduce((sum,[key,,width])=>sum+(fixedColumnKeys.has(key)||lockedColumns.has(key)?0:width),0);
  const table = section.querySelector('table');
  table.style.setProperty('--fixed-columns-width','calc(var(--name-width) + var(--status-width) + '+fixedWidth+'px)');
  table.style.setProperty('--scroll-weight',scrollWeight);
  const columnWidths = visible.map(([key,,width])=>{
    if (lockedColumns.has(key)) return 'var(--'+key+'-width)';
    return fixedColumnKeys.has(key)?width+'px':'calc((var(--table-width) - var(--fixed-columns-width)) * '+(width/scrollWeight)+')';
  });
  const pinnedClass = key => lockedColumns.has(key)?'pinned-'+key:'';
  table.innerHTML = '<colgroup>'+columnWidths.map(width=>'<col style="width:'+width+'">').join('')+'</colgroup><thead><tr>'+visible.map(([key,label,,align])=>{
    const active = direction && key===state.sort;
    const indicator = '<span class="sort-indicator" aria-hidden="true">'+(active?arrow:'↕')+'</span>';
    const sortable = !unsortableColumns.has(key);
    const content = sortable
      ? '<button class="column-sort" data-sort-column="'+key+'" aria-label="'+label+', sort '+(active&&direction==='ascending'?'descending':'ascending')+'">'+label+indicator+'</button>'
      : label;
    const definition = key==='bids' && side==='demand' ? metricDefinitions.bids+' The secondary value is BID QPS ÷ Outgoing QPS.' : metricDefinitions[key];
    const info = definition?metricTooltip(side+'-definition-'+key,icon('info'),definition,'metric-info',label+' definition',true):'';
    const heading = key==='type' && state.hidden.has('type')?'Ad Formats':content;
    const headingClass = identityColumns.some(([identityKey])=>identityKey===key)?pinnedClass(key):'heading-right';
    return '<th scope="col" class="'+headingClass+'"'+(sortable?' aria-sort="'+(active?direction:'none')+'"':'')+'><span class="column-heading">'+heading+info+'</span></th>';
  }).join('')+'</tr></thead><tbody>'
    +(shown.length?shown.map(row=>'<tr>'+visible.map(([key,,,align])=>'<td class="'+[align,pinnedClass(key)].filter(Boolean).join(' ')+'">'+rowCell(key,row,side)+'</td>').join('')+'</tr>').join(''):'<tr><td class="empty" colspan="'+visible.length+'">No matching endpoints</td></tr>')+'</tbody>';
  bindTooltipDismissal(table);
  const chip = (key,value,label) => '<button class="chip" data-chip="'+key+'" data-value="'+safe(value)+'" aria-label="Remove '+safe(label)+' filter">'+safe(label)+icon('close')+'</button>';
  section.querySelector('.applied').innerHTML = '<span class="match" aria-live="polite">'+rows.length+' matching endpoint'+(rows.length===1?'':'s')+'</span>'
    +(side==='demand' && state.regions.size===regions.length?chip('all-regions','','Region: All ('+regions.length+')'):[...state.regions].map(r=>chip('region',r,'Region: '+r)).join(''))
    +[...state.types].map(type=>chip('type',type,'Type: '+type)).join('')
    +(state.regions.size||state.types.size||state.query?'<button class="link" data-clear>Clear filters</button>':'');
  const range = shown.length?number(start+1)+'–'+number(start+shown.length)+' of '+number(rows.length):'0 results';
  const pages = Array.from({length:rows.length?total:0},(_,i)=>i+1);
  section.querySelector('.pagination').innerHTML = '<span class="page-range">'+range+'</span><div class="page-controls">'
    +'<div class="page-buttons"><button class="page-prev" aria-label="Previous page" data-page="'+(state.page-1)+'" '+(state.page===1?'disabled':'')+'>'+icon('pageChevron')+'</button>'
    +pages.map(p=>'<button aria-label="Page '+p+'" data-page="'+p+'" '+(p===state.page?'aria-current="page"':'')+'>'+p+'</button>').join('')
    +'<button aria-label="Next page" data-page="'+(state.page+1)+'" '+(state.page===total?'disabled':'')+'>'+icon('pageChevron')+'</button></div>'
    +'<label class="page-size">Rows per page <select data-size>'+[2,3,25,50].map(n=>'<option value="'+n+'" '+(n===state.size?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div>';
  for (const input of section.querySelectorAll('[data-region]')) input.checked = state.regions.has(input.dataset.region);
  for (const input of section.querySelectorAll('[data-type]')) input.checked = state.types.has(input.dataset.type);
  for (const input of section.querySelectorAll('[data-column]')) input.checked = !state.hidden.has(input.dataset.column);
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
let dialogTrigger;
dialog.addEventListener('close',()=>{
  dialogTrigger?.focus({preventScroll:true});
  dialogTrigger = undefined;
});
function openDialog(title,body,{drawer=false,closeIcon=false}={}) {
  dialog.classList.toggle('endpoint-drawer',drawer);
  const close = closeIcon
    ? '<button type="button" data-close class="quiet icon-button" aria-label="Close">'+icon('close')+'</button>'
    : '<button type="button" data-close class="quiet" autofocus>Close</button>';
  dialog.innerHTML = '<header class="dialog-head"><h2 id="dialog-title">'+safe(title)+'</h2>'+close+'</header><div class="dialog-body">'+body+'</div>';
  dialog.scrollTop = 0;
  if (!dialog.open) dialog.showModal();
  else dialog.querySelector('[data-close]').focus();
}
const fact = (label,value,description='') => '<div class="fact">'+safe(label)+'<strong>'+safe(value)+'</strong>'+(description?secondary(description):'')+'</div>';
function endpointShare(key,row) {
  switch (key) {
    case 'qps': return [ratio(row.qps,regionalIncoming.get(row.region)),'of region'];
    case 'validIncoming': return [ratio(row.validIncoming,row.qps),'of incoming'];
    case 'outgoing': return [ratio(row.outgoing,regionalOutgoing.get(row.region)),'of region'];
    case 'bids': return [ratio(row.bids,row.outgoing),'of outgoing'];
    default: return [null,''];
  }
}
function confirmTurnOff(side,row,trigger) {
  const supply = side==='supply';
  const metric = supply?'qps':'outgoing';
  const value = row[metric];
  const [share] = endpointShare(metric,row);
  const traffic = value==null?'':' ('+number(value)+' req/s'
    +(share==null?'':', '+percentage(share)+' of '+row.region+(supply?' incoming':' outgoing'))+')';
  const message = supply
    ? 'Turning this off may stop accepting traffic from this endpoint'+traffic+' and the revenue it generates.'
    : 'Turning this off may stop sending requests to this DSP'+traffic+'.';
  dialogTrigger = trigger;
  openDialog('Turn off '+row.name+'?','<p>'+safe(message)+'</p>'
    +'<p class="meta"><span class="assumption-pill">Assumption</span> Platform behavior is being confirmed.</p>'
    +'<div class="dialog-actions"><button type="button" class="tool" data-close autofocus>Cancel</button>'
    +'<button type="button" class="primary" data-confirm-off="'+safe(row.id)+'" data-side="'+side+'">Turn off</button></div>',{closeIcon:true});
}
function setEndpointStatus(side,row,active) {
  row.active = active;
  renderEndpoints(side);
  const section = $('#'+side);
  const toggle = [...section.querySelectorAll('[data-toggle]')].find(control=>control.dataset.toggle===row.id);
  (toggle ?? section.querySelector('[data-menu="filter"]')).focus({preventScroll:true});
  toast(active?'Demo endpoint enabled':'Demo endpoint disabled');
}
function validRateTrend(row) {
  if (row.id!=='SSP-1042') return '';
  const samples = [0.941,0.939,0.937,0.936,0.938,0.940,0.939,0.937,0.935,0.938,0.940,0.939];
  const min = Math.min(...samples), range = Math.max(...samples)-min;
  const points = samples.map((value,index)=>(8+304*index/(samples.length-1))+','+(64-56*(value-min)/range)).join(' ');
  return '<h3>Valid rate trend</h3><figure class="endpoint-trend"><svg viewBox="0 0 320 72" aria-hidden="true"><path d="M8 64H312"/><polyline points="'+points+'"/></svg>'
    +'<figcaption>Valid rate fell from '+percentage(samples[0])+' to '+percentage(samples.at(-1))+' over the last 12 hours.</figcaption></figure>'
    +'<p class="meta"><span class="assumption-pill">Assumption</span> Loss reasons: not available</p>';
}
function inspect(side,row) {
  const groups = endpointGroups[side].map(([group,columns])=>'<section class="drawer-group"><h3>'+group+'</h3><div class="facts">'
    +columns.map(([key,label])=>{
      const [share,suffix] = endpointShare(key,row);
      return fact(label,metricText(key,row,side),key==='name'?row.id:share==null?'':percentage(share)+' '+suffix);
    }).join('')+'</div></section>').join('');
  openDialog(row.name,
    '<p class="meta">'+safe([row.id,side==='supply'?'Supply':'Demand',row.type,row.region,'Demo data'].join(' · '))+'</p>'
    +'<p class="meta">Today 00:00–14:00 UTC · Updated 14:00 UTC</p>'+groups
    +(side==='supply'?validRateTrend(row):'')
    +'<h3>Continue investigation</h3><div class="dialog-actions"><button class="primary" data-diagnose="Statistics" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Statistics</button><button class="tool" data-diagnose="Loggers" data-side="'+side+'" data-id="'+safe(row.id)+'">Open Loggers</button></div><p class="meta">Pass endpoint, region and period to supported diagnostic routes.</p>',{drawer:true});
}
function addEndpoint(side) {
  openDialog('Add '+side+' endpoint','<p class="meta">Demo endpoint. Changes apply to this session.</p><form class="endpoint-form" data-add-form="'+side+'"><label>Name<input name="name" required maxlength="70"></label><label>Type<select name="type">'+types.map(t=>'<option>'+t+'</option>').join('')+'</select></label><label>Region<select name="region">'+regions.map(r=>'<option>'+r+'</option>').join('')+'</select></label><div class="dialog-actions"><button class="primary" type="submit">Add endpoint</button></div></form>');
  dialog.querySelector('input').focus();
}
function exportCsv(side) {
  const rows = matching(side);
  const shares = side==='supply'
    ? new Map([['qps','% of region'],['validIncoming','% of incoming']])
    : new Map([['outgoing','% of region'],['bids','% of outgoing']]);
  const columns = endpointColumns[side].flatMap(([key,label])=>shares.has(key)?[[key,label],[key,shares.get(key),true]]:[[key,label]]);
  const data = [['ID',...columns.map(([,label])=>label==='Name / ID'?'Name':label)],
    ...rows.map(row=>[row.id,...columns.map(([key,,isShare])=>{
      const value = isShare?percentage(endpointShare(key,row)[0])
        : key==='timeout'||(key==='win'&&side==='demand')?percentage(metricValue(row,key))
        : ['status','adFormats'].includes(key)?metricText(key,row,side):metricValue(row,key);
      return value==='—'?'':value;
    })])];
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
  if (d.inspect) {
    if (!dialog.open) dialogTrigger = button;
    return inspect(side,endpointLists[side].find(row=>row.id===d.inspect));
  }
  if (d.add!==undefined) {
    if (side==='demand') return addEndpoint(side);
    if (document.fullscreenElement) await document.exitFullscreen();
    return openSupplyEditor(button);
  }
  if (d.export!==undefined) return exportCsv(side);
  if (d.expand!==undefined) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('#'+side).requestFullscreen();
    } catch {toast('Fullscreen is unavailable in this browser');}
    return;
  }
  if (d.resetColumns!==undefined) {
    state.hidden = new Set(defaultHiddenColumns[side]);
  } else if (d.toggle) {
    const row = endpointLists[side].find(r=>r.id===d.toggle);
    if (row.active) return confirmTurnOff(side,row,button);
    return setEndpointStatus(side,row,true);
  } else if (d.confirmOff && dialog.open) {
    const row = endpointLists[side].find(r=>r.id===d.confirmOff);
    dialog.close();
    return setEndpointStatus(side,row,false);
  } else if (d.sortColumn) {
    state.direction=state.sort===d.sortColumn && state.direction==='ascending'?'descending':'ascending';
    state.sort=d.sortColumn;
    state.page=1;
  } else if (d.page) state.page=Number(d.page);
  else if (d.chip) {
    if (d.chip==='region') state.regions.delete(d.value);
    else if (d.chip==='all-regions') state.regions.clear();
    else if (d.chip==='type') state.types.delete(d.value);
    state.page=1;
  } else if (d.clear!==undefined) {
    state.regions.clear();state.types.clear();state.query='';state.page=1;
    $('#'+side+' input[type=search]').value='';
  } else return;
  renderEndpoints(side);
  if (d.sortColumn) $('#'+side+' [data-sort-column="'+d.sortColumn+'"]').focus({preventScroll:true});
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
  } else if (d.type) {
    if (input.checked) state.types.add(d.type);else state.types.delete(d.type);
  } else if (d.column && !lockedColumns.has(d.column)) {
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
  const row = {name,id,type:fields.get('type'),region:fields.get('region'),active:true,qps:null,fill:null,win:null,render:null,rcpm:null};
  if (side==='supply') {
    row.active = fields.has('active');
    row.formats = fields.getAll('formats');
    row.margin = Number(fields.get('margin'));
    row.spendLimit = fields.get('spendLimit')===''?null:Number(fields.get('spendLimit'));
    row.settings = fields;
  }
  endpointLists[side].unshift(row);
  const state=states[side];
  state.query='';state.regions.clear();state.types.clear();state.sort='original';state.page=1;
  $('#'+side+' input[type=search]').value='';
  if (side==='supply') closeSupplyEditor();
  else dialog.close();
  renderEndpoints(side);toast('Demo endpoint added');
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
    if (activeTip?.isConnected) {
      if (activeTip.closest('#supply-editor')) event.preventDefault();
      activeTip.setAttribute('data-dismissed','');
      activeTip.lastElementChild.hidePopover();
      activeTip = undefined;
    }
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
    if (expected) assert(percentage(endpointShare('validIncoming',row)[0])===expected,row.id+' valid rate');
  }
  const us = regionalTraffic.find(([region])=>region==='US_EAST');
  const apac = regionalTraffic.find(([region])=>region==='APAC');
  assert(utilization(us[1],us[4],'check-us').includes('7.18%'),'US_EAST incoming plan utilization');
  assert(utilization(apac[3],apac[4],'check-apac').includes('98.76%'),'APAC outgoing plan utilization');
  console.info('Demo data checks passed');
}
