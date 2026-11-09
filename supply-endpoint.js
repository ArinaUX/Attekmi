'use strict';

const supplyConnectionTypes = ['RTB','VAST','Prebid','JS','Prebid. JS'];
const supplyMacros = ['PAGE_URL','DOMAIN','DNT','LOCATION_LON','LOCATION_LAT','CATEGORY','REF_URL','APP_BUNDLE','STORE_URL','DEVICE_MAKE','DEVICE_MODEL','OSV','FEED','DEALID','PLACEMENT','WIDTH','HEIGHT','DEVICE_TYPE','GDPR','GDPR_CONSENT','COPPA','CCPA','CCPA_CONSENT','MIN_DURATION','MAX_DURATION','PLAYER_WIDTH','PLAYER_HEIGHT','SCHAIN'].map(name=>'['+name+']');
const supplyChoices = {
  mimes:['video/mp4','video/mpeg','video/ogg','video/webm','application/javascript'],
  playback:['Page Load with Sound On','Page Load with Sound Off by Default','Click with Sound On'],
  protocols:['VAST 2.0','VAST 3.0','VAST 2.0 Wrapper','VAST 3.0 Wrapper','VAST 4.0','VAST 4.0 Wrapper'],
  frameworks:['VPAID 1.0','VPAID 2.0','MRAID-2'],
};
const supplyFilters = ['Responses with adomain','Secure links only','Original device object','Default COPPA','Prioritize GEO from IP'];
const supplyScanners = ['WhiteOps (Post-bid)','Geoedge','Pixalate Pre-bid IP filter','Pixalate Pre-bid IFA filter','Pixalate Pre-bid UA filter','Pixalate Pre-bid Defased App filter','Pixalate Pre-bid Bundle filter','Pixalate Pre-bid Data Center IP filter'];
const supplyAdditional = ['Send test responses','IAB Categories'];
const supplyFieldHelp = {
  company:'Company associated with this endpoint.',region:'Region for this endpoint.',
  type:'Connection type used by this endpoint.',trafficType:'Traffic environment for this endpoint.',
  bidfloor:'Minimum bid price for this endpoint.',margin:'Percentage applied using the selected margin type.',
  spendLimit:'Spend limit for this endpoint.',tmax:'Default time allowed for a response, in milliseconds.',
  rewarded:'Whether the ad experience is rewarded.',startDelay:'When playback starts relative to the content.',
  placement:'Where the player appears.',mimes:'Media MIME types accepted by the endpoint.',
  position:'Position of the ad on the page.',playback:'Playback methods supported by the player.',
  protocols:'VAST versions and wrappers supported by the player.',frameworks:'API frameworks supported by the player.',
  macros:'Placeholders included in the demo impression URL.',dsps:'DSPs affected by the selected allow or block rule.',
};

function supplyLabel(label,name) {
  const help = supplyFieldHelp[name];
  return '<span class="supply-label">'+label+(help?metricTooltip('supply-help-'+name,icon('info'),help,'metric-info',label.replace('*','')+' information'):'')+'</span>';
}
function supplyField(label,name,attrs='',unit='') {
  return '<div class="supply-field"><label for="supply-'+name+'">'+supplyLabel(label,name)+'</label><div class="supply-input">'
    +'<input id="supply-'+name+'" name="'+name+'" '+attrs+'>'+(unit?'<span aria-hidden="true">'+unit+'</span>':'')+'</div></div>';
}
function supplySelect(label,name,options,selected='',placeholder='') {
  return '<label class="supply-field">'+supplyLabel(label,name)+'<select name="'+name+'"'+(name==='region'?' required':'')+'>'
    +(placeholder?'<option value="">'+safe(placeholder)+'</option>':'')
    +options.map(option=>'<option'+(option===selected?' selected':'')+'>'+safe(option)+'</option>').join('')
    +'</select></label>';
}
function supplySegments(label,name,options,selected) {
  return '<fieldset class="supply-field"><legend>'+supplyLabel(label,name)+'</legend><div class="supply-segments">'
    +options.map(option=>'<label><input type="radio" name="'+name+'" value="'+safe(option)+'"'+(option===selected?' checked':'')+'><span>'+safe(option)+'</span></label>').join('')
    +'</div></fieldset>';
}
function supplyChecks(name,options,selected=[]) {
  return '<div class="supply-checks">'+options.map(option=>'<label><input type="checkbox" name="'+name+'" value="'+safe(option)+'"'+(selected.includes(option)?' checked':'')+'>'+safe(option)+'</label>').join('')+'</div>';
}
function supplyBadges(values) {
  return values.slice(0,3).map(value=>'<span class="badge supply-choice">'+safe(value)+'</span>').join('')
    +(values.length>3?'<span class="badge supply-choice" title="'+safe(values.slice(3).join(', '))+'">+'+(values.length-3)+'</span>':'');
}
function supplyMulti(label,name,options,selected=[]) {
  const id = 'supply-options-'+name;
  return '<div class="supply-field" data-multi="'+name+'">'+supplyLabel(label,name)
    +'<button type="button" class="supply-multi" popovertarget="'+id+'" aria-label="'+label+'"><span class="supply-selected"></span>'+icon('chevron')+'</button>'
    +'<div id="'+id+'" class="supply-options" popover aria-label="'+label+' options">'+supplyChecks(name,options,selected)+'</div></div>';
}
function supplyAdvanced(body,label='Advanced settings') {
  return '<section class="supply-advanced"><h3>'+label+'</h3><div class="supply-advanced-body">'+body+'</div></section>';
}
function supplyToggle(label,name) {
  return '<label class="supply-toggle"><input type="checkbox" role="switch" name="'+name+'" aria-label="'+label+'"><span class="switch-track" aria-hidden="true"></span>'
    +(name==='active'?'':'<span>'+label+'</span>')+'</label>';
}
function supplyAccordion(number,title,body,{required=false,open=false}={}) {
  return '<details class="panel supply-step" data-step="'+number+'"'+(open?' open':'')+'><summary><span class="supply-step-title">'+number+'. '+title+'</span>'
    +(required?'<span class="badge supply-required">Required</span>':'')+icon('chevron')+'</summary><div class="supply-step-body">'+body+'</div></details>';
}
function supplyFormMarkup() {
  const general = supplyField('Endpoint Name *','name','required maxlength="70"')
    +supplyField('Company*','company','required maxlength="100" placeholder="Select or Create Company"')
    +supplySelect('Region*','region',regions,'US_EAST')
    +supplySegments('Connection Type','type',supplyConnectionTypes,'VAST')
    +'<div data-vast-connection>'+supplySegments('VAST Connection Mode','connection',['VAST to All','VAST to RTB','VAST to VAST'],'VAST to All')+'</div>';
  const inventory = '<fieldset class="supply-field"><legend>Ad Format</legend>'+supplyChecks('formats',['Video','Audio'])+'</fieldset>'
    +supplySegments('Traffic type','trafficType',['Mobile Web','Desktop','Mobile App','CTV'],'Desktop')
    +supplySelect('Sizes','sizes',['All Sizes'],'All Sizes')
    +supplyChecks('flexibleSize',['Flexible size matching']);
  const pricing = supplyField('Bidfloor *','bidfloor','type="number" min="0" step="any" required')
    +supplyChecks('fixedBidfloor',['Fixed Bid Floor'])
    +supplySegments('Margin Type','marginType',['Fixed','Adaptive','Range'],'Fixed')
    +supplyField('Margin*','margin','type="number" min="0" max="100" step="any" required value="15" aria-label="Margin (%)"','%')
    +supplyAdvanced(supplyField('Spend Limit','spendLimit','type="number" min="0" step="any"')
      +supplyField('Default tmax','tmax','type="number" min="0" step="1"'));
  const vast = '<div class="supply-setting">'+supplyToggle('Rewarded','rewarded')+'</div>'
    +supplySelect('Skip','skip',['No','Yes'],'No')
    +'<div class="supply-field-grid">'+supplyField('Skip Min','skipMin','type="number" min="0" value="1"','sec.')
    +supplyField('Skip After','skipAfter','type="number" min="0" value="100"','sec.')
    +supplyField('Min Duration','minDuration','type="number" min="0" value="1"','sec.')
    +supplyField('Max Duration','maxDuration','type="number" min="0" value="100"','sec.')+'</div>'
    +supplySelect('Placement','placement',['In-stream','Out-stream'],'','Select Placement')
    +supplyAdvanced(supplySelect('Start Delay','startDelay',['Pre-roll','Mid-roll','Post-roll'],'','Select Start Delay')
      +supplyMulti('Mimes','mimes',supplyChoices.mimes,supplyChoices.mimes)
      +supplySelect('Positions','position',['Above the Fold','Below the Fold'],'Above the Fold')
      +supplyMulti('Playback methods','playback',supplyChoices.playback,supplyChoices.playback)
      +supplyMulti('Protocols','protocols',supplyChoices.protocols,supplyChoices.protocols)
      +supplyMulti('API Frameworks','frameworks',supplyChoices.frameworks,supplyChoices.frameworks));
  const stats = '<div class="supply-field-grid">'+supplySelect('DSP rule','dspRule',['Allow','Block'],'Allow')
    +supplyMulti('DSPs','dsps',endpointLists.demand.map(row=>row.name))+'</div>'
    +'<fieldset class="supply-check-group"><legend>Filters</legend>'+supplyChecks('filters',supplyFilters)+'</fieldset>'
    +supplyAdvanced('<fieldset class="supply-check-group"><legend>Scanners</legend>'+supplyChecks('scanners',supplyScanners)+'</fieldset>'
      +'<fieldset class="supply-check-group"><legend>Additional Settings</legend>'+supplyChecks('additional',supplyAdditional)+'</fieldset>'
      +'<div class="supply-field"><label for="supply-impression">Demo URL</label>'
      +'<div class="supply-preview"><span class="limit-tip"><input type="text" id="supply-impression" readonly aria-describedby="supply-url-tooltip">'
      +'<span class="limit-tooltip supply-url-tooltip" id="supply-url-tooltip" role="tooltip" popover="manual"><span class="tooltip-content"></span></span></span>'
      +'<button type="button" class="quiet tool" data-supply-copy aria-live="polite">Copy</button></div></div>'
      +supplyMulti('Macros','macros',supplyMacros,supplyMacros)
      +'<div class="supply-api">'+supplyField('SSP’s Statistics API link','api','type="url" placeholder="Place API Link" aria-describedby="supply-api-help"')
      +'<button type="button" class="tool" data-supply-test>Test</button></div><p class="supply-help" id="supply-api-help">Replace the date with [%Y-m-d%]. Test checks the URL format locally.</p><p role="status" data-api-result></p>');

  return '<form id="supply-endpoint-form" data-add-form="supply">'
    +'<header class="supply-editor-head"><div class="supply-editor-identity">'+supplyToggle('Endpoint status','active')
    +'<span class="badge" data-supply-type></span><div class="supply-editor-title"><h1 id="supply-editor-title" tabindex="-1" autofocus>Supply Endpoint</h1><p data-supply-company></p></div></div>'
    +'<button type="button" class="icon-button" data-supply-cancel aria-label="Close Supply Endpoint">'+icon('close')+'</button></header>'
    +'<div class="supply-editor-grid"><div class="supply-steps">'
    +supplyAccordion(1,'General',general,{required:true,open:true})
    +supplyAccordion(2,'Inventory',inventory)
    +supplyAccordion(3,'Pricing &amp; Timing',pricing,{required:true})
    +supplyAccordion(4,'VAST Extensions',vast)
    +supplyAccordion(5,'Endpoint &amp; API Stats',stats)
    +'</div><aside class="panel supply-summary" aria-labelledby="supply-summary-title"><div class="supply-summary-head"><h2 id="supply-summary-title">Summary</h2>'
    +'<p>Always visible</p></div><div data-supply-summary tabindex="0" role="region" aria-label="Selected endpoint settings"></div></aside></div>'
    +'<footer class="supply-editor-footer"><button type="button" class="tool" data-supply-cancel>Cancel</button><button type="submit" class="primary" disabled>Generate Endpoint</button></footer></form>';
}

function supplySummaryGroup(title,rows) {
  return '<section class="supply-summary-group"><h3>'+title+'</h3><dl>'
    +rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+(Array.isArray(value)&&value.length?'<span class="supply-selected">'+supplyBadges(value)+'</span>':safe(typeof value==='string'&&value||'—'))+'</dd></div>').join('')+'</dl></section>';
}
function updateSupplySummary(form) {
  const data = new FormData(form);
  const value = name => String(data.get(name)??'').trim();
  const list = name => data.getAll(name).join(', ');
  const unit = (name,suffix) => value(name)?value(name)+suffix:'';
  form.querySelector('[data-supply-type]').textContent = value('type');
  form.querySelector('[data-supply-company]').textContent = value('company')||'Company Name';
  form.querySelector('button[type=submit]').disabled = [...form.querySelectorAll('[required]')].some(field=>!field.validity.valid);
  for (const multi of form.querySelectorAll('[data-multi]')) {
    const choices = data.getAll(multi.dataset.multi);
    multi.querySelector('.supply-selected').innerHTML = supplyBadges(choices)
      +(!choices.length?'<span class="supply-default">None selected</span>':'');
  }
  const preview = 'https://example.invalid/ssp?seat=[SEAT]&token=[TOKEN]'
    +data.getAll('macros').map(macro=>'&'+macro.slice(1,-1).toLowerCase()+'='+macro).join('');
  const url = form.querySelector('#supply-impression');
  if (url.value!==preview) {
    url.value = preview;
    form.querySelector('#supply-url-tooltip .tooltip-content').textContent = preview;
    form.querySelector('[data-supply-copy]').textContent = 'Copy';
  }
  form.querySelector('[data-supply-summary]').innerHTML =
    supplySummaryGroup('General',[
      ['Endpoint',value('name')||'Not entered'],['Company',value('company')||'Not selected'],['Status',data.has('active')?'On':'Off'],
      ['Region',value('region')],['Connection',[value('type'),value('connection')].filter(Boolean).join(' · ')],
    ])
    +supplySummaryGroup('Inventory',[
      ['Ad formats',list('formats')||'None selected'],['Traffic',value('trafficType')],['Sizes',value('sizes')],['Size matching',data.has('flexibleSize')?'Flexible':'—'],
    ])
    +supplySummaryGroup('Pricing &amp; Timing',[
      ['Bidfloor',value('bidfloor')?(data.has('fixedBidfloor')?'Fixed · ':'')+value('bidfloor'):'Not entered'],
      ['Margin',value('margin')?value('marginType')+' · '+unit('margin','%'):'Not entered'],
      ['Spend limit',value('spendLimit')],['Default tmax',unit('tmax',' ms')],
    ])
    +supplySummaryGroup('VAST Extensions',[
      ['Rewarded / skip',(data.has('rewarded')?'On':'Off')+' / '+value('skip')],
      ['Skip timing',value('skipMin')+'–'+value('skipAfter')+' sec.'],
      ['Duration',value('minDuration')+'–'+value('maxDuration')+' sec.'],
      ['Start / placement',[value('startDelay'),value('placement')].filter(Boolean).join(' · ')],
      ['Position',value('position')],['Playback',data.getAll('playback')],
      ['MIME types',data.getAll('mimes')],['Protocols',data.getAll('protocols')],['API frameworks',data.getAll('frameworks')],
    ])
    +supplySummaryGroup('Endpoint &amp; API Stats',[
      ['Macros',data.getAll('macros')],['Statistics API',value('api')||'Not set'],
      ['DSP rule',value('dspRule')],['DSPs',data.getAll('dsps').length?data.getAll('dsps'):'None selected'],
      ['Filters',list('filters')||'None selected'],['Scanners',list('scanners')||'None selected'],
      ['Additional',list('additional')||'None selected'],
    ]);
}
function openNextSupplyStep(step) {
  if ([...step.querySelectorAll('input, select')].some(field=>!field.validity.valid)) return;
  const next = step.nextElementSibling;
  if (!next) return;
  step.dataset.advanced = 'true';
  next.open = true;
}
function syncSupplyConnection(form) {
  const connection = form.querySelector('[data-vast-connection]');
  connection.hidden = form.elements.type.value!=='VAST';
  connection.querySelector('fieldset').disabled = connection.hidden;
}
function bindSupplyMenus(form) {
  for (const menu of form.querySelectorAll('.supply-options')) {
    const trigger = menu.previousElementSibling;
    menu.addEventListener('beforetoggle',event=>{
      if (event.newState!=='open') return;
      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight-rect.bottom-10;
      const above = rect.top-10;
      const opensUp = below<160 && above>below;
      menu.style.width = rect.width+'px';
      menu.style.left = rect.left+'px';
      menu.style.maxHeight = Math.min(220,Math.max(0,opensUp?above:below))+'px';
      menu.style.top = opensUp?'auto':rect.bottom+4+'px';
      menu.style.bottom = opensUp?window.innerHeight-rect.top+4+'px':'auto';
    });
  }
  form.querySelector('.supply-steps').addEventListener('scroll',()=>{
    form.querySelector('.supply-options:popover-open')?.hidePopover();
  });
}
function openSupplyEditor(trigger) {
  const editor = $('#supply-editor');
  editor.innerHTML = supplyFormMarkup();
  const form = editor.querySelector('form');
  const defaults = new Map([...form.querySelectorAll('select, input[type=number]')].filter(field=>field.value!=='').map(field=>[field,field.value]));
  for (const field of defaults.keys()) field.classList.add('supply-default');
  syncSupplyConnection(form);
  updateSupplySummary(form);
  bindTooltipDismissal(form);
  bindSupplyMenus(form);
  form.addEventListener('input',event=>{
    if (['name','company'].includes(event.target.name)) {
      const field = event.target;
      field.setCustomValidity(field.value && !field.value.trim()?'Enter a value.':'');
    }
    const field = event.target;
    if (defaults.has(field)) field.classList.toggle('supply-default',field.value===defaults.get(field));
    if (field.name==='type') syncSupplyConnection(form);
    if (event.target.name==='api') form.querySelector('[data-api-result]').textContent='';
    updateSupplySummary(form);
    const step = event.target.closest('[data-step]');
    if (!step || step.dataset.advanced || (step.dataset.step==='2' && !step.querySelector('input[name=formats]:checked'))) return;
    openNextSupplyStep(step);
  });
  form.addEventListener('invalid',event=>{event.target.closest('[data-step]').open=true;},true);
  form.addEventListener('click',async event=>{
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-supply-cancel')) return closeSupplyEditor();
    if (button.hasAttribute('data-supply-test')) {
      const api = form.elements.api;
      form.querySelector('[data-api-result]').textContent = !api.value?'Enter an API link to test.'
        :api.validity.valid && /^https?:\/\//i.test(api.value)?'URL format is valid.':'Enter a valid HTTP or HTTPS URL.';
    }
    if (button.hasAttribute('data-supply-copy')) {
      const preview = form.querySelector('#supply-impression');
      const url = preview.value;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        preview.select();
        button.textContent = 'Copy manually';
        return;
      }
      if (preview.value===url) button.innerHTML = icon('check')+'Copied';
    }
  });
  editor.addEventListener('close',()=>trigger.focus({preventScroll:true}),{once:true});
  editor.showModal();
}
function closeSupplyEditor() {
  $('#supply-editor').close();
}
