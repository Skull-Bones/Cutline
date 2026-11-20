// UI: rendering, events and storage.
  // Profile edits go into a draft and only apply when Save is pressed.
  var draft = null;
  function addDaysLabel(n){ var d=new Date(); d.setDate(d.getDate()+Math.round(n)); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
  function planHTML(p){
    var t=calcTargets(p), out='', from=R1(p.weightLb||0), to=R1(p.goalWeightLb||0);
    var end=shiftDate(p.goalStart||todayStr(), t.totalDays), wk=Math.min(t.weeks, Math.floor(t.elapsed/7)+1);
    var lead = t.elapsed>0 && !t.ended ? 'Week <b>'+wk+'<\/b> of <b>'+t.weeks+'<\/b>. ' : '';
    if(!t.delta) out+='<p>You&rsquo;re at your goal weight, so your targets are set to maintenance.<\/p>';
    else if(t.ended) out+='<p class="plan-warn">Your '+t.weeks+'-week timeline ended on <b>'+esc(prettyDate(end))+'<\/b>, with <b>'+R1(Math.abs(t.delta))+' lb<\/b> still to go. Move the slider and press Save to set a new timeline.<\/p>';
    else if(t.delta>0) out+='<p>'+lead+'To go from <b>'+from+'<\/b> to <b>'+to+' lb<\/b> by <b>'+esc(prettyDate(end))+'<\/b>, lose about <b>'+R1(t.delta/t.daysLeft*7)+' lb<\/b> a week. That takes a daily deficit of <b>'+N(t.needed)+'<\/b> kcal.<\/p>';
    else out+='<p>'+lead+'To go from <b>'+from+'<\/b> to <b>'+to+' lb<\/b> by <b>'+esc(prettyDate(end))+'<\/b>, gain about <b>'+R1(-t.delta/t.daysLeft*7)+' lb<\/b> a week. That takes a daily surplus of <b>'+N(-t.needed)+'<\/b> kcal.<\/p>';
    if(t.limited==='floor') out+='<p class="plan-warn">That pace would put you under <b>'+N(t.floor)+'<\/b> kcal a day, the lowest Cutline will set. Your target stays at that level, which reaches your goal in about <b>'+R1(t.weeksActual)+'<\/b> weeks. Slide the timeline longer to match.<\/p>';
    else if(t.limited==='surplus') out+='<p class="plan-warn">The surplus is capped at <b>500<\/b> kcal a day to limit fat gain, which reaches your goal in about <b>'+R1(t.weeksActual)+'<\/b> weeks.<\/p>';
    else if(t.delta>0 && t.delta/t.daysLeft*7>(p.weightLb||0)*0.01) out+='<p class="plan-warn">That&rsquo;s more than 1% of your body weight a week, which makes it harder to keep muscle. A longer timeline is gentler.<\/p>';
    out+='<p>Daily calories <b>'+N(t.calorieTarget)+'<\/b> &middot; protein <b>'+R(t.proteinG)+'g<\/b>'+(p.proteinFloorEnabled?' (floor)':'')+' &middot; net carbs <b>'+R(t.netCarbG)+'g<\/b> &middot; fat <b>'+R(t.fatG)+'g<\/b><\/p>';
    out+='<p class="plan-fine">Maintenance is about '+N(t.tdee)+' kcal (BMR '+N(t.bmr)+' &times; activity'+(p.tdeeAdjust?', '+(p.tdeeAdjust>0?'+':'')+N(p.tdeeAdjust)+' from your results':'')+'). The plan assumes about 3,500 kcal per pound of body weight.<\/p>';
    return out;
  }
  function profileHTML(){
    var p=draft||state.profile, w=goalWeeksOf(p), h='';
    function num(id,label,field,val,attrs){ return '<div class="field"><label for="'+id+'">'+label+'<\/label><input id="'+id+'" type="number" data-field="'+field+'" value="'+(val==null?'':val)+'" '+(attrs||'')+'><\/div>'; }
    h+='<div class="field-grid">';
    h+='<div class="field"><label for="f-sex">Sex<\/label><select id="f-sex" data-field="sex"><option value=""'+(!p.sex?' selected':'')+'>Not set<\/option><option value="male"'+(p.sex==='male'?' selected':'')+'>Male<\/option><option value="female"'+(p.sex==='female'?' selected':'')+'>Female<\/option><\/select><\/div>';
    h+=num('f-age','Age','age',p.age||'','min="10" max="100" placeholder="e.g. 34"');
    h+=num('f-height','Height (in)','heightIn',p.heightIn,'step="0.1"');
    h+='<div class="field"><label for="f-activity">Activity<\/label><select id="f-activity" data-field="activity">';
    ACTIVITY.forEach(function(a){ h+='<option value="'+a.v+'"'+(Math.abs(p.activity-a.v)<0.001?' selected':'')+'>'+esc(a.label)+'<\/option>'; });
    h+='<\/select><\/div>';
    h+=num('f-weight','Current weight (lb)','weightLb',p.weightLb,'step="0.1"');
    h+=num('f-goal','Goal weight (lb)','goalWeightLb',p.goalWeightLb,'step="0.1"');
    h+='<div class="field full"><label for="f-weeks">Time to reach your goal<\/label><div class="weeks-row"><input id="f-weeks" type="range" min="'+GOAL_MIN_WEEKS+'" max="'+GOAL_MAX_WEEKS+'" step="1" data-field="goalWeeks" value="'+w+'" aria-describedby="weeks-val"><span id="weeks-val" class="weeks-val">'+w+' weeks<\/span><\/div><div class="weeks-scale"><span>6 weeks<\/span><span>26 weeks<\/span><\/div><\/div>';
    h+='<div class="field"><label for="f-diet">Carb target<\/label><select id="f-diet" data-field="dietMode"><option value="keto"'+(p.dietMode==='keto'?' selected':'')+'>Keto (&le;25g net)<\/option><option value="lowcarb"'+(p.dietMode==='lowcarb'?' selected':'')+'>Low carb (&le;75g net)<\/option><\/select><\/div>';
    h+=num('f-netlimit','Net carb limit (g)','netCarbLimit',p.netCarbLimit>0?p.netCarbLimit:'','step="1" min="0" placeholder="auto"');
    h+=num('f-protfloor','Protein floor (g)','proteinFloorG',p.proteinFloorG,'step="5"'+(p.proteinFloorEnabled?'':' disabled'));
    h+='<div class="field full checkrow"><label class="checklabel"><input type="checkbox" id="f-protfloor-on" data-field="proteinFloorEnabled" '+(p.proteinFloorEnabled?'checked':'')+'> Use protein floor instead of bodyweight target (optional goal)<\/label><\/div>';
    h+='<\/div>';
    h+='<div class="targets-out" id="prof-out">'+planHTML(p)+'<\/div>';
    h+='<div class="prof-actions"><span id="prof-status" class="prof-status">'+(draft?'Unsaved changes':'Saved')+'<\/span><button type="button" class="btn-ghost" data-action="discard-profile" id="prof-discard"'+(draft?'':' disabled')+'>Discard<\/button><button type="button" class="btn-save" data-action="save-profile" id="prof-save"'+(draft?'':' disabled')+'>Save changes<\/button><\/div>';
    return h;
  }
  function updateProfilePreview(){
    var p=draft||state.profile, o=$('prof-out'); if(o) o.innerHTML=planHTML(p);
    var w=$('weeks-val'); if(w) w.textContent=goalWeeksOf(p)+' weeks';
    ['prof-save','prof-discard'].forEach(function(id){ var b=$(id); if(b) b.disabled=!draft; });
    var s=$('prof-status'); if(s) s.textContent=draft?'Unsaved changes':'Saved';
    var pf=$('f-protfloor'); if(pf) pf.disabled=!p.proteinFloorEnabled;
  }

  // ---- Personalization from the log ----
  // Older entries may use names that aren't in the catalog verbatim; resolve each distinct name once per render.
  var resolveCache=new Map();
  function resolvedName(e){
    if(resolveCache.has(e.name)) return resolveCache.get(e.name);
    var r=e.name; if(!foodByName(r)){ var m=findFoods(r)[0]; if(m) r=m.n; }
    resolveCache.set(e.name, r); return r;
  }
  function allEntries(){
    var out=[];
    Object.keys(state.days).sort().forEach(function(d){ (state.days[d]||[]).forEach(function(e){ out.push(e); }); });
    return out;
  }
  function amountFromPortion(portion){
    var m=String(portion||'').match(/^(\d+(?:\.\d+)?) × /);
    return m ? m[1]+'x' : String(portion||'');
  }
  // Entry ids start with the time they were logged ('e' + Date.now() in base 36 + 4 random characters).
  function loggedAt(e){
    var ms=parseInt(String(e.id||'').slice(1,-4),36);
    return ms>1.6e12 && ms<Date.now()+864e5 ? new Date(ms) : null;
  }
  // The 3 foods you usually log around this time of day, each with the amount you usually log then.
  // Every past entry votes for its food, weighted by how close its logging time was to now (a bell curve with a
  // 90-minute spread, wrapping past midnight). Entries with no recorded time get a tiny vote so a brand-new
  // tracker still suggests something. Foods logged only once never show.
  function usualFoods(now){
    now=now||new Date();
    var hNow=now.getHours()+now.getMinutes()/60, info={};
    allEntries().forEach(function(e){
      var at=loggedAt(e), w=0.01;
      if(at){ var d=Math.abs(at.getHours()+at.getMinutes()/60-hNow); d=Math.min(d,24-d); w=Math.exp(-d*d/(2*1.5*1.5)); }
      var n=resolvedName(e), a=amountFromPortion(e.portion), o=info[n]||(info[n]={n:n,count:0,score:0,amts:{}});
      o.count++; o.score+=w; o.amts[a]=(o.amts[a]||0)+w;
    });
    var list=Object.keys(info).map(function(k){ return info[k]; }).filter(function(o){ return o.count>=2; });
    list.sort(function(a,b){ return b.score-a.score || b.count-a.count || (a.n<b.n?-1:1); });
    return list.slice(0,3).map(function(o){
      var best=Object.keys(o.amts).sort(function(a,b){ return o.amts[b]-o.amts[a]; })[0];
      return {n:o.n, count:o.count, amt:best};
    });
  }
  function proteinFoods(){
    var cnt={};
    allEntries().forEach(function(e){ var n=resolvedName(e); cnt[n]=(cnt[n]||0)+1; });
    var out=[];
    Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a];}).forEach(function(n){
      var f=findFoods(n)[0];
      if(f && f.n===n && f.p>=20 && out.indexOf(f)<0) out.push(f);
    });
    if(!out.length) out.push(FOODS[0]);
    return out.slice(0,2);
  }
  function gramsFor(food,proteinG){ return Math.max(5, Math.round(proteinG/(food.p/100)/5)*5); }
  function shortName(food){ return food.n.split(',')[0].toLowerCase() + (food.n.indexOf('cooked')>-1 ? ' (cooked)' : ''); }

  function loggedDays(){ return Object.keys(state.days).filter(function(d){ return (state.days[d]||[]).length>0; }).sort(); }
  function dayStats(d){ var t=dayTotals(state.days[d]||[]); return {d:d,kcal:t.cals,prot:t.protein,net:t.carbs-t.fiber,fat:t.fat,n:(state.days[d]||[]).length}; }
  function windowDays(){ var today=todayStr(); return loggedDays().filter(function(d){ return d<today; }).slice(-7); }

  function insightsHTML(t){
    var win=windowDays();
    if(win.length<3) return '<p>Insights appear after three logged days.<\/p>';
    var st=win.map(dayStats), n=st.length;
    function avg(k){ return st.reduce(function(a,s){ return a+s[k]; },0)/n; }
    var lines=[];

    var weights=state.weights||{}, wd=Object.keys(weights).sort();
    if(wd.length>=2){
      var w0=weights[wd[0]], w1=weights[wd[wd.length-1]], dlt=R1(w1-w0);
      lines.push('<p>Weight: <b>'+R1(w0)+' lb<\/b> on '+esc(prettyDate(wd[0]))+', now <b>'+R1(w1)+' lb<\/b> ('+(dlt>0?'+':'')+dlt+' lb). Goal is <b>'+R1(state.profile.goalWeightLb)+' lb<\/b>.<\/p>');
    }

    var prot=avg('prot'), hit=st.filter(function(s){ return s.prot>=t.proteinG; }).length, gap=t.proteinG-prot, top=proteinFoods()[0];
    lines.push('<p>Protein averaged <b>'+R(prot)+'g<\/b> over your last '+n+' logged days and reached <b>'+R(t.proteinG)+'g<\/b> on <b>'+hit+' of '+n+'<\/b>.' +
      (gap>0 ? ' Closing the average gap takes about <b>'+gramsFor(top,gap)+'g<\/b> more '+esc(shortName(top))+' a day.' : ' You are above your goal on average.')+'<\/p>');

    var kcal=avg('kcal'), target=t.calorieTarget;
    if(kcal<target*0.75){
      lines.push('<p>Logged intake averages <b>'+N(kcal)+'<\/b> kcal against a target of <b>'+N(target)+'<\/b>. If that is everything you eat, your deficit is about <b>'+N(t.tdee-kcal)+'<\/b> kcal a day against an estimated maintenance of <b>'+N(t.tdee)+'<\/b>, not the planned '+N(t.deficit)+'. If it is not, something is going unlogged, such as oil, sauces, drinks or snacks.<\/p>');
    } else if(kcal>target*1.1){
      lines.push('<p>Logged intake averages <b>'+N(kcal)+'<\/b> kcal, above your target of <b>'+N(target)+'<\/b>.<\/p>');
    } else {
      lines.push('<p>Logged intake averages <b>'+N(kcal)+'<\/b> kcal, close to your target of <b>'+N(target)+'<\/b>.<\/p>');
    }

    var net=avg('net'), over=st.filter(function(s){ return s.net>t.netCarbG; }).length;
    var bySrc={}, total=0;
    win.forEach(function(d){ (state.days[d]||[]).forEach(function(e){ var c=e.carbs-(e.fiber||0), nm=resolvedName(e); bySrc[nm]=(bySrc[nm]||0)+c; total+=c; }); });
    var topSrc=Object.keys(bySrc).sort(function(a,b){ return bySrc[b]-bySrc[a]; })[0];
    var share=(topSrc && total>0) ? bySrc[topSrc]/total : 0;
    lines.push('<p>Net carbs averaged <b>'+R(net)+'g<\/b> against your <b>'+R(t.netCarbG)+'g<\/b> limit, over it on <b>'+over+' of '+n+'<\/b> days.' +
      (share>=0.4 ? ' <b>'+esc(topSrc.split(',')[0])+'<\/b> supplies <b>'+R(share*100)+'%<\/b> of them.' : '')+'<\/p>');

    return lines.join('');
  }

  function historyHTML(t, viewDate){
    var days=loggedDays().slice(-10).reverse(), today=todayStr();
    if(!days.length) return '';
    var html='<div class="hist">';
    days.forEach(function(d){
      var s=dayStats(d), pct=t.proteinG>0 ? Math.min(100,(s.prot/t.proteinG)*100) : 0, good=s.prot>=t.proteinG;
      html+='<button type="button" class="hrow'+(d===viewDate?' cur':'')+'" data-action="goto-day" data-date="'+esc(d)+'">' +
        '<span class="top"><span>'+(d===today?'Today':esc(prettyDate(d)))+'<\/span><span>'+R(s.prot)+' / '+R(t.proteinG)+'g protein<\/span><\/span>' +
        '<span class="bar"><i class="'+(good?'good':'')+'" style="width:'+pct+'%"><\/i><\/span>' +
        '<span class="meta">'+N(s.kcal)+' kcal &middot; '+R1(s.net)+'g net carbs &middot; '+R(s.fat)+'g fat<\/span><\/button>';
    });
    return html+'<\/div>';
  }

  function meterRow(name,unit,val,target,floorType){
    var pct = target>0 ? Math.min(100,(val/target)*100) : 0;
    var over = target>0 && val>target;
    var reached = target>0 && val>=target;
    var cls = reached?'good':'';
    var valCls = floorType ? (reached?'good':'') : (over?'warn':(reached?'good':''));
    return '<div class="meter-row"><div class="meter-top"><span class="name">'+esc(name)+'<\/span><span class="val '+valCls+'">'+R(val)+' / '+R(target)+unit+'<\/span><\/div>' +
      '<div class="bar"><i class="'+cls+'" style="width:'+pct+'%"><\/i><\/div><\/div>';
  }

  var tab='log', TABS=[['log','Log food'],['totals','Today\'s totals'],['food','Food log'],['history','Your log so far'],['profile','Profile & targets']];
  function tabsHTML(){
    return '<nav class="tabs" role="tablist" aria-label="Sections">'+TABS.map(function(x){
      var on=tab===x[0];
      return '<button type="button" role="tab" id="tab-'+x[0]+'" class="tab'+(on?' on':'')+'" aria-selected="'+on+'" aria-controls="panel" tabindex="'+(on?0:-1)+'" data-action="tab" data-tab="'+x[0]+'">'+esc(x[1])+'<\/button>';
    }).join('')+'<\/nav>';
  }
  // ---- Entry editing ----
  var editingId = null;
  function editFormHTML(e){
    var food=foodByName(e.name), h='<form class="edit-form" data-action="save-edit" data-id="'+esc(e.id)+'" autocomplete="off">';
    h+='<div class="edit-title">Edit '+esc(e.name)+'<\/div>';
    if(food){
      h+='<div class="field full"><label for="ed-amt">Amount<\/label><input id="ed-amt" type="text" value="'+esc(amountFromPortion(e.portion))+'" autocapitalize="off" spellcheck="false"><span class="ed-hint" id="ed-hint">Change the amount and the numbers below update.<\/span><\/div>';
    } else {
      h+='<p class="ed-hint full">This entry isn&rsquo;t linked to a catalog food, so edit its numbers directly.<\/p>';
    }
    [['ed-cal','Calories',e.cals],['ed-p','Protein (g)',e.protein],['ed-c','Carbs (g)',e.carbs],['ed-fi','Fiber (g)',e.fiber||0],['ed-f','Fat (g)',e.fat]].forEach(function(x){
      h+='<div class="field"><label for="'+x[0]+'">'+x[1]+'<\/label><input id="'+x[0]+'" type="number" inputmode="decimal" step="0.1" min="0" value="'+R1(x[2]||0)+'"><\/div>';
    });
    h+='<div class="edit-actions full"><button type="button" class="btn-ghost" data-action="cancel-edit">Cancel<\/button><button type="submit" class="btn-save">Save entry<\/button><\/div>';
    return h+'<\/form>';
  }
  function updateEditFromAmount(){
    var form=document.querySelector('.edit-form'); if(!form) return;
    var e=(state.days[viewDate]||[]).filter(function(x){ return x.id===form.getAttribute('data-id'); })[0]; if(!e) return;
    var food=foodByName(e.name), hint=$('ed-hint'), amt=food ? parseAmount($('ed-amt').value, food) : null;
    if(!amt){ if(hint){ hint.textContent='Amount not understood. Try 179, 6oz, or 2x.'; hint.className='ed-hint bad'; } return; }
    var m=foodMacros(food, amt.g);
    $('ed-cal').value=R1(m.cals); $('ed-p').value=R1(m.protein); $('ed-c').value=R1(m.carbs); $('ed-fi').value=R1(m.fiber); $('ed-f').value=R1(m.fat);
    if(hint){ hint.textContent=amt.label; hint.className='ed-hint'; }
  }

  // ---- Daily weigh-in and weight trend ----
  function latestWeight(){ var w=state.weights||{}, k=Object.keys(w).sort(); return k.length ? {d:k[k.length-1], v:w[k[k.length-1]]} : null; }
  function weighInHTML(){
    var today=todayStr(), w=state.weights||{}, has=w[today]!=null, last=latestWeight();
    var h='<section><h2>Daily weigh-in<\/h2><div class="card"><form class="weigh-form" data-action="save-weight" autocomplete="off" novalidate>';
    h+='<div class="field"><label for="w-today">Today&rsquo;s weight (lb)<\/label><input id="w-today" type="number" inputmode="decimal" step="0.1" min="50" max="1000" value="'+(has?R1(w[today]):'')+'" placeholder="'+(last?R1(last.v):'e.g. 198.4')+'"><\/div>';
    h+='<button type="submit" class="btn-save">'+(has?'Update':'Save weight')+'<\/button><\/form>';
    h+='<p class="weigh-note" id="weigh-note">'+(has ? 'Logged today: <b>'+R1(w[today])+' lb<\/b>. Your targets use this weight.'
      : last ? 'Last weigh-in: <b>'+R1(last.v)+' lb<\/b> on '+esc(prettyDate(last.d))+'. Weigh in at the same time each day, ideally in the morning.'
      : 'Weigh in at the same time each day, ideally in the morning. Your trend appears under Your log so far.')+'<\/p>';
    return h+'<\/div><\/section>';
  }
  function weightChartHTML(){
    var w=state.weights||{}, keys=Object.keys(w).sort(), goal=state.profile.goalWeightLb||0;
    var h='<section><h2>Weight trend<\/h2><div class="card">';
    if(keys.length<2) return h+'<p class="empty-note">Save your weight on the Log food tab at least twice to see your trend here.<\/p><\/div><\/section>';
    var cut=shiftDate(todayStr(),-90), pts=keys.filter(function(d){ return d>=cut; });
    if(pts.length<2) pts=keys.slice(-2);
    var vals=pts.map(function(d){ return w[d]; }), all=vals.concat(goal>0?[goal]:[]);
    var lo=Math.floor(Math.min.apply(null,all)-1), hi=Math.ceil(Math.max.apply(null,all)+1);
    var W=600, H=230, L=46, Rp=14, T=16, B=34, d0=dayNum(pts[0]), span=Math.max(1, dayNum(pts[pts.length-1])-d0);
    function x(d){ return L+(dayNum(d)-d0)/span*(W-L-Rp); }
    function y(v){ return T+(hi-v)/(hi-lo)*(H-T-B); }
    var grid='', ticks=[hi, (hi+lo)/2, lo];
    ticks.forEach(function(v){ grid+='<line x1="'+L+'" x2="'+(W-Rp)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" class="ch-grid"/><text x="'+(L-8)+'" y="'+(y(v)+4).toFixed(1)+'" class="ch-lab" text-anchor="end">'+R1(v)+'<\/text>'; });
    var line=pts.map(function(d,i){ return (i?'L':'M')+x(d).toFixed(1)+' '+y(w[d]).toFixed(1); }).join(' ');
    var dots=pts.map(function(d,i){ var last=i===pts.length-1; return '<circle cx="'+x(d).toFixed(1)+'" cy="'+y(w[d]).toFixed(1)+'" r="'+(last?5:3.5)+'" class="'+(last?'ch-last':'ch-dot')+'"><title>'+esc(prettyDate(d))+': '+R1(w[d])+' lb<\/title><\/circle>'; }).join('');
    var goalLine = goal>0 ? '<line x1="'+L+'" x2="'+(W-Rp)+'" y1="'+y(goal).toFixed(1)+'" y2="'+y(goal).toFixed(1)+'" class="ch-goal"/><text x="'+(W-Rp)+'" y="'+(y(goal)-6).toFixed(1)+'" class="ch-goal-lab" text-anchor="end">Goal '+R1(goal)+' lb<\/text>' : '';
    var first=pts[0], lastD=pts[pts.length-1], change=R1(w[lastD]-w[first]);
    var recent=pts.filter(function(d){ return d>=shiftDate(todayStr(),-28); });
    var rate = recent.length>=2 ? slopePerDay(recent.map(function(d){ return [dayNum(d), w[d]]; }))*7 : null;
    var summary='From '+R1(w[first])+' lb on '+prettyDate(first)+' to '+R1(w[lastD])+' lb on '+prettyDate(lastD)+' ('+(change>0?'+':'')+change+' lb).';
    h+='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc('Weight trend. '+summary)+'">'+grid+goalLine+'<path d="'+line+'" class="ch-line"/>'+dots+
      '<text x="'+L+'" y="'+(H-10)+'" class="ch-lab">'+esc(prettyDate(first))+'<\/text><text x="'+(W-Rp)+'" y="'+(H-10)+'" class="ch-lab" text-anchor="end">'+esc(prettyDate(lastD))+'<\/text><\/svg>';
    h+='<p class="chart-note">'+esc(summary)+(rate!==null ? ' Over the last 4 weeks your trend is <b>'+(rate>0?'+':'')+R1(rate)+' lb a week<\/b>.' : '')+'<\/p>';
    return h+'<\/div><\/section>';
  }

  // ---- 14-day milestone and the target check ----
  function milestoneHTML(){
    var n=loggedDays().length;
    if(n<ADAPT_MIN_LOGGED || state.flags.milestone14) return '';
    return '<div class="milestone" role="status"><p class="ms-title">14 days logged. Congratulations, keep going.<\/p>' +
      '<p>Steady logging is what makes your numbers trustworthy. Cutline can now check your targets against your real results.<\/p>' +
      '<div class="ms-actions"><button type="button" class="btn-save" data-action="ms-review">Check my targets<\/button><button type="button" class="btn-ghost" data-action="ms-dismiss">Keep going<\/button><\/div><\/div>';
  }
  function adaptHTML(){
    var p=state.profile, n=loggedDays().length, h='<section id="adapt"><h2>Target check<\/h2><div class="card adapt">';
    if(n<ADAPT_MIN_LOGGED){
      var pct=Math.min(100, n/ADAPT_MIN_LOGGED*100);
      return h+'<p>Log <b>'+ADAPT_MIN_LOGGED+' days<\/b> and Cutline will compare your targets with your real results. <b>'+n+' of '+ADAPT_MIN_LOGGED+'<\/b> so far.<\/p><div class="bar"><i style="width:'+pct+'%"><\/i><\/div><\/div><\/section>';
    }
    var a=adaptiveEstimate(state), t=calcTargets(p);
    if(!a.ready){
      return h+'<p>To check your targets, Cutline needs, from the last 4 weeks:<\/p><ul class="checklist">' +
        '<li class="'+(a.logged>=ADAPT_MIN_DAYS?'ok':'')+'"><b>'+ADAPT_MIN_DAYS+' logged days<\/b> (you have '+a.logged+')<\/li>' +
        '<li class="'+(a.weighIns>=ADAPT_MIN_WEIGHINS && a.span>=ADAPT_MIN_SPAN?'ok':'')+'"><b>'+ADAPT_MIN_WEIGHINS+' weigh-ins<\/b> spread over at least '+ADAPT_MIN_SPAN+' days (you have '+a.weighIns+(a.weighIns>1?' over '+a.span+' days':'')+')<\/li><\/ul>' +
        '<p class="plan-fine">Use the daily weigh-in on the Log food tab.<\/p>'+appliedHTML(p)+'<\/div><\/section>';
    }
    var c=clampedAdjust(a.estimate, t.formulaTdee), applied=p.tdeeAdjust||0;
    h+='<p>Over the last 4 weeks you logged <b>'+a.logged+' days<\/b> averaging <b>'+N(a.intake)+'<\/b> kcal, and your weight trend is <b>'+(a.slope*7>0?'+':'')+R1(a.slope*7)+' lb a week<\/b>. That puts your real maintenance near <b>'+N(a.estimate)+'<\/b> kcal, against the formula&rsquo;s <b>'+N(t.formulaTdee)+'<\/b>.<\/p>';
    if(c.clamped) h+='<p class="plan-warn">That&rsquo;s a big gap, so Cutline only moves maintenance by up to 25% at a time, to <b>'+N(c.value)+'<\/b> kcal. A large gap often means some food went unlogged.<\/p>';
    h+='<p class="plan-fine">This is only accurate if you logged everything you ate on those days.<\/p>';
    if(c.adjust!==applied) h+='<div class="ms-actions"><button type="button" class="btn-save" data-action="adapt-apply" data-adj="'+c.adjust+'">Use '+N(c.value)+' kcal as my maintenance<\/button><\/div>';
    return h+appliedHTML(p)+'<\/div><\/section>';
  }
  function appliedHTML(p){
    if(!p.tdeeAdjust) return '';
    return '<p class="applied">Maintenance is adjusted by <b>'+(p.tdeeAdjust>0?'+':'')+N(p.tdeeAdjust)+'<\/b> kcal from your results'+(p.tdeeAdjustDate?' (set '+esc(prettyDate(p.tdeeAdjustDate))+')':'')+'. <button type="button" class="linkbtn" data-action="adapt-undo">Undo<\/button><\/p>';
  }

  // ---- Scan a label (inside Claude) or a barcode (on the web) for custom foods ----
  var scan = {sample:null, images:false, insideClaude:!!(window.claude && window.claude.use)};
  function scanLabelText(){ return scan.sample && scan.images ? 'Scan a nutrition label' : 'Scan a barcode'; }
  function scanHTML(){
    return '<div class="scan full"><input type="file" id="scan-file" accept="image/*" capture="environment" hidden>' +
      '<div class="scan-row"><button type="button" class="btn-ghost" data-action="scan-start" id="scan-btn">'+scanLabelText()+'<\/button>' +
      (scan.insideClaude ? '' : '<button type="button" class="linkbtn" data-action="scan-manual">Type a barcode number<\/button>')+'<\/div>' +
      '<div class="scan-code" id="scan-code" hidden><label for="scan-num">Barcode number<\/label><div class="scan-row"><input id="scan-num" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 0894700010045"><button type="button" class="btn-ghost" data-action="scan-lookup">Look up<\/button><\/div><\/div>' +
      '<p class="scan-msg" id="scan-msg" role="status" aria-live="polite"><\/p><\/div>';
  }
  function scanMsg(t,bad){ var el=$('scan-msg'); if(el){ el.textContent=t; el.className='scan-msg'+(bad?' bad':''); } }
  function showManualCode(t){ var c=$('scan-code'); if(c) c.hidden=false; if(t) scanMsg(t); var n=$('scan-num'); if(n) n.focus(); }
  function okNum(v){ var n=parseFloat(v); return isFinite(n) && n>=0 ? R1(n) : ''; }
  function fillCustom(o){
    var map={'cf-name':o.name||'','cf-serv':o.serving?okNum(o.serving):'','cf-cal':okNum(o.cal),'cf-protein':okNum(o.protein),'cf-carbs':okNum(o.carbs),'cf-fiber':okNum(o.fiber),'cf-fat':okNum(o.fat)};
    Object.keys(map).forEach(function(id){ var el=$(id); if(el) el.value=map[id]; });
    var nm=$('cf-name'); if(nm) nm.focus();
  }
  function readLabel(file){
    scanMsg('Reading the label...');
    var prompt='You read US nutrition facts labels. Look at the photo and reply with JSON only, no other text: ' +
      '{"readable": true or false, "name": product name if printed or "", "serving_g": serving size in grams as a number or null if not given in grams, ' +
      '"calories": number, "protein": grams, "carbs": total carbohydrate grams, "fiber": dietary fiber grams, "fat": total fat grams}. ' +
      'Use the per-serving column. If the photo is not a readable nutrition label, set readable to false.';
    scan.sample.json(prompt, {images:[file], modelTier:'default'}).then(function(v){
      if(!v || v.readable===false || !isFinite(parseFloat(v.calories))){ scanMsg('Couldn\'t read a nutrition label in that photo. Try again with the label flat, well lit and in focus.', true); return; }
      fillCustom({name:v.name, serving:v.serving_g, cal:v.calories, protein:v.protein, carbs:v.carbs, fiber:v.fiber, fat:v.fat});
      scanMsg((v.serving_g?'':'The label didn\'t give a serving weight in grams, so enter it. ')+'Check these numbers against the label, then press Save custom food.');
    }, function(err){
      if(err && err.code==='not_granted'){ scan.sample=null; var b=$('scan-btn'); if(b) b.textContent=scanLabelText(); scanMsg('Label reading isn\'t allowed here. Enter the numbers by hand.', true); }
      else if(err && err.code==='rate_limited') scanMsg('Too many scans for now. Try again in a minute.', true);
      else scanMsg('Couldn\'t read the label right now. Enter the numbers by hand.', true);
    });
  }
  function readBarcode(file){
    if(!('BarcodeDetector' in window)){ showManualCode('This browser can\'t read barcodes from photos. Type the number under the barcode.'); return; }
    scanMsg('Looking for a barcode...');
    var det;
    try{ det=new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']}); }catch(e){ showManualCode('This browser can\'t read barcodes from photos. Type the number under the barcode.'); return; }
    createImageBitmap(file).then(function(bmp){ return det.detect(bmp); }).then(function(codes){
      if(codes && codes.length) lookupBarcode(String(codes[0].rawValue));
      else showManualCode('No barcode found in that photo. Type the number under the barcode instead.');
    }, function(){ showManualCode('Couldn\'t read that photo. Type the number under the barcode instead.'); });
  }
  function offNumber(n, key){ var v=parseFloat(n[key]); return isFinite(v) ? v : null; }
  function lookupBarcode(code){
    code=String(code||'').replace(/\D/g,'');
    if(!/^\d{8,14}$/.test(code)){ scanMsg('A barcode number has 8 to 14 digits.', true); return; }
    if(scan.insideClaude){ scanMsg('Product lookup isn\'t available inside Claude. Scan the nutrition label instead.', true); return; }
    scanMsg('Looking up '+code+'...');
    fetch('https://world.openfoodfacts.org/api/v2/product/'+code+'.json?fields=product_name,brands,nutriments,serving_quantity')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || d.status!==1 || !d.product){ showManualCode(); scanMsg('Barcode '+code+' isn\'t in Open Food Facts yet. Enter the label numbers by hand.', true); return; }
        var pr=d.product, n=pr.nutriments||{}, kcal=offNumber(n,'energy-kcal_100g');
        if(kcal===null && offNumber(n,'energy_100g')!==null) kcal=offNumber(n,'energy_100g')/4.184;
        if(kcal===null){ scanMsg('Found '+(pr.product_name||'the product')+', but it has no calorie data. Enter the label numbers by hand.', true); return; }
        var serv=parseFloat(pr.serving_quantity); if(!(serv>0)) serv=100; var k=serv/100;
        var name=[pr.brands?String(pr.brands).split(',')[0].trim():'', pr.product_name||''].filter(Boolean).join(' ');
        fillCustom({name:name, serving:serv, cal:kcal*k, protein:(offNumber(n,'proteins_100g')||0)*k, carbs:(offNumber(n,'carbohydrates_100g')||0)*k, fiber:(offNumber(n,'fiber_100g')||0)*k, fat:(offNumber(n,'fat_100g')||0)*k});
        scanMsg('Found '+(name||'the product')+'. Open Food Facts is crowd-sourced, so check the numbers against your package, then press Save custom food.');
      }, function(){ scanMsg('Couldn\'t reach Open Food Facts. Check your connection or enter the numbers by hand.', true); });
  }

  // ---- Backup: export and import ----
  var downloadsApi=null, pendingImport=null;
  function backupHTML(){
    var h='<section><h2>Backup<\/h2><div class="card backup"><p>Save a copy of your whole log as a file, or restore one.<\/p><div class="ms-actions">' +
      '<button type="button" class="btn-ghost" data-action="export">Export backup<\/button><button type="button" class="btn-ghost" data-action="import-start">Import backup<\/button>' +
      '<input type="file" id="import-file" accept="application/json,.json" hidden><\/div>';
    if(pendingImport){
      h+='<div class="import-confirm"><p>Replace your current log (<b>'+loggedDays().length+' days<\/b>) with the backup from <b>'+esc(pendingImport.when)+'<\/b> (<b>'+pendingImport.days+' days<\/b>)? This can&rsquo;t be undone.<\/p><div class="ms-actions"><button type="button" class="btn-save" data-action="import-confirm">Replace my log<\/button><button type="button" class="btn-ghost" data-action="import-cancel">Cancel<\/button><\/div><\/div>';
    }
    return h+'<p class="backup-msg" id="backup-msg" role="status" aria-live="polite"><\/p><\/div><\/section>';
  }
  function backupMsg(t,bad){ var el=$('backup-msg'); if(el){ el.textContent=t; el.className='backup-msg'+(bad?' bad':''); } }
  function exportBackup(){
    var json=JSON.stringify({app:'cutline', version:2, exported:new Date().toISOString(), state:{profile:state.profile, customFoods:state.customFoods, weights:state.weights, flags:state.flags, days:state.days}}, null, 1);
    var name='cutline-backup-'+todayStr()+'.json';
    if(downloadsApi){
      downloadsApi.save({filename:name, data:json}).then(function(){ backupMsg('Backup saved as '+name+'.'); }, function(){ copyBackup(json); });
    } else if(!scan.insideClaude){
      try{ var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([json],{type:'application/json'})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); backupMsg('Backup downloaded as '+name+'.'); }
      catch(e){ copyBackup(json); }
    } else copyBackup(json);
  }
  function copyBackup(json){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(json).then(function(){ backupMsg('Downloads aren\'t available here, so the backup was copied. Paste it into a note or file to keep it.'); }, function(){ backupMsg('Couldn\'t save or copy the backup here.', true); });
    } else backupMsg('Couldn\'t save or copy the backup here.', true);
  }
  function readImport(file){
    if(file.size>5e6){ backupMsg('That file is too big to be a Cutline backup.', true); return; }
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var b=JSON.parse(fr.result), s=b && b.state;
        if(!b || b.app!=='cutline' || !s || !s.profile || typeof s.days!=='object') throw new Error('not a Cutline backup');
        var clean=cleanState(s), days=clean.days, n=Object.keys(days).filter(function(d){ return days[d].length; }).length, ex=String(b.exported||'').slice(0,10);
        pendingImport={state:clean, days:n, when:DATE_RE.test(ex)?prettyDate(ex):'an unknown date'};
        render();
      }catch(e){ backupMsg('That file isn\'t a Cutline backup.', true); }
    };
    fr.onerror=function(){ backupMsg('Couldn\'t read that file.', true); };
    fr.readAsText(file);
  }

  var openState = {'cf-wrap':false,'prof-wrap':true};
  document.addEventListener('toggle', function(ev){ if(ev.target && ev.target.id in openState) openState[ev.target.id]=ev.target.open; }, true);

  function renderApp(state, viewDate){
    var p = state.profile;
    var entries = (state.days[viewDate]||[]).slice();
    var totals = dayTotals(entries);
    var netCarbsToday = totals.carbs - totals.fiber;
    var t = calcTargets(p);
    var remaining = t.calorieTarget - totals.cals;
    var protLeft = t.proteinG - totals.protein;
    var missing = []; if(!p.age) missing.push('age'); if(!p.sex) missing.push('sex');
    var usual = usualFoods();

    var html = '';
    html += tabsHTML() + saveStateHTML();
    html += '<div role="tabpanel" id="panel" aria-labelledby="tab-'+tab+'" tabindex="0">';
    if(tab==='log' || tab==='totals' || tab==='food'){
    html += '<div class="hero">';
    html += '<div class="hero-top"><span class="brand">Cutline<\/span>' +
      '<div class="daynav"><button data-action="prev-day" aria-label="Previous day">&#8249;<\/button>' +
      '<span class="daylabel">'+esc(viewDate===todayStr()?'Today':prettyDate(viewDate))+'<\/span>' +
      '<button data-action="next-day" aria-label="Next day">&#8250;<\/button><\/div><\/div>';
    html += '<div class="stats">' +
      '<div class="stat"><span class="num'+(protLeft<=0?' good':'')+'">'+(protLeft>0?R(protLeft)+'g':'Goal hit')+'<\/span><span class="unit">'+(protLeft>0?'protein to go':'protein, '+R(totals.protein)+'g of '+R(t.proteinG)+'g')+'<\/span><\/div>' +
      '<div class="stat"><span class="num'+(remaining<0?' over':'')+'">'+N(remaining)+'<\/span><span class="unit">kcal left<\/span><\/div><\/div>';
    if(protLeft>0){
      html += '<div class="sub">To reach <b>'+R(t.proteinG)+'g<\/b> protein, add about '+proteinFoods().map(function(f){ return '<b>'+gramsFor(f,protLeft)+'g<\/b> '+esc(shortName(f)); }).join(' or ')+'.<\/div>';
    }
    html += '<div class="sub">Target '+N(t.calorieTarget)+' kcal &middot; eaten '+N(totals.cals)+' kcal' + (missing.length?' &middot; estimated, add your '+missing.join(' &amp; ')+' below for a precise number':'') + '<\/div>';
    html += '<\/div>';
    }

    if(tab==='log'){
    html += milestoneHTML() + weighInHTML();
    html += '<section><h2>Log food<\/h2><div class="card"><form class="addform logform" data-action="add-entry" autocomplete="off">' +
      '<div class="field"><label for="f-food">Food<\/label><input id="f-food" type="text" placeholder="chicken breast" autocomplete="off" autocapitalize="off" spellcheck="false"><\/div>' +
      '<div class="field"><label for="f-amt">Amount<\/label><input id="f-amt" type="text" inputmode="text" placeholder="179 or 6oz" autocomplete="off" autocapitalize="off" spellcheck="false"><\/div>';
    if(usual.length){
      html += '<div class="usual"><span class="lab">Your usual<\/span><div class="row">' +
        usual.map(function(u){ return '<button type="button" class="chip" data-action="pick-usual" data-name="'+esc(u.n)+'" data-amt="'+esc(u.amt)+'">'+esc(u.n)+' &middot; '+esc(u.amt)+'<\/button>'; }).join('') +
        '<\/div><\/div>';
    }
    html += '<div class="pv" id="pv"><\/div>' +
      '<button type="submit">Log it<\/button>' +
      '<\/form>' +
      '<details id="cf-wrap" style="margin-top:14px"'+(openState['cf-wrap']?' open':'')+'><summary style="cursor:pointer;font-size:12.5px;color:var(--text-muted)">Custom foods (from a label)<\/summary>' +
      '<form class="addform custom" data-action="add-custom">' + scanHTML() +
      '<div class="field"><label for="cf-name">Name<\/label><input id="cf-name" name="name" type="text" required><\/div>' +
      '<div class="field"><label for="cf-serv">Serving size (g)<\/label><input id="cf-serv" name="serving" type="number" step="0.1" min="1" value="100" required><\/div>' +
      '<div class="field"><label for="cf-cal">Calories per serving<\/label><input id="cf-cal" name="cal" type="number" step="1" required><\/div>' +
      '<div class="field"><label for="cf-protein">Protein (g)<\/label><input id="cf-protein" name="protein" type="number" step="0.1" value="0"><\/div>' +
      '<div class="field"><label for="cf-carbs">Carbs (g)<\/label><input id="cf-carbs" name="carbs" type="number" step="0.1" value="0"><\/div>' +
      '<div class="field"><label for="cf-fiber">Fiber (g)<\/label><input id="cf-fiber" name="fiber" type="number" step="0.1" value="0"><\/div>' +
      '<div class="field full"><label for="cf-fat">Fat (g)<\/label><input id="cf-fat" name="fat" type="number" step="0.1" value="0"><\/div>' +
      '<div class="pv-hint full">Enter the label numbers for one serving and its weight in grams. Log it later as 1x, 2x, or by weight.<\/div>' +
      '<button type="submit">Save custom food<\/button>' +
      '<\/form>';
    if((state.customFoods||[]).length){
      html += '<div class="cflist">' + state.customFoods.map(function(f,i){
        return '<div class="cfitem"><span>'+esc(f.n)+' <span class="cfm">per 100g: '+R(f.cal)+' kcal, P'+R1(f.p)+', C'+R1(f.c)+', F'+R1(f.f)+'<\/span><\/span><button type="button" data-action="del-custom" data-i="'+i+'">Delete<\/button><\/div>';
      }).join('') + '<\/div>';
    }
    html += '<\/details><\/div><\/section>';

    }
    if(tab==='totals'){
    html += '<section><h2>'+(viewDate===todayStr()?'Today\'s totals':esc(prettyDate(viewDate))+' totals')+'<\/h2><div class="card meters">';
    html += meterRow('Protein','g',totals.protein,t.proteinG,true);
    html += meterRow('Calories',' kcal',totals.cals,t.calorieTarget,false);
    html += meterRow('Net carbs','g',netCarbsToday,t.netCarbG,false);
    html += meterRow('Fat','g',totals.fat,t.fatG,false);
    html += '<\/div><\/section>';

    }
    if(tab==='food'){
    html += '<section><h2>Food log<\/h2><div class="entries">';
    if(entries.length===0){
      html += '<div class="empty card">Nothing logged for this day yet.<\/div>';
    } else {
      entries.forEach(function(e){
        if(e.id===editingId){ html += '<div class="entry editing">'+editFormHTML(e)+'<\/div>'; return; }
        var netC = e.carbs-(e.fiber||0);
        html += '<div class="entry"><div class="info"><div class="name">'+esc(e.name)+'<\/div>' +
          (e.portion?'<div class="portion">'+esc(e.portion)+'<\/div>':'') +
          '<div class="macros">'+R(e.cals)+' kcal &middot; P'+R1(e.protein)+'g &middot; C'+R1(e.carbs)+'g (net '+R1(netC)+'g) &middot; F'+R1(e.fat)+'g<\/div>' +
          '<\/div><button type="button" class="edit" data-action="edit-entry" data-id="'+esc(e.id)+'" aria-label="Edit '+esc(e.name)+'">Edit<\/button>' +
          '<button type="button" class="del" data-action="del-entry" data-id="'+esc(e.id)+'" aria-label="Remove '+esc(e.name)+'">&times;<\/button><\/div>';
      });
    }
    html += '<\/div><\/section>';

    }
    if(tab==='history'){
    html += '<section><h2>Your log so far<\/h2><div class="card"><div class="insights">'+insightsHTML(t)+'<\/div>'+historyHTML(t, viewDate)+'<\/div><\/section>';
    html += adaptHTML() + weightChartHTML();

    }
    if(tab==='profile'){
    html += '<section><h2>Profile &amp; targets<\/h2><div class="card">';
    html += profileHTML();
    html += '<\/div><\/section>';
    html += backupHTML();
    }

    html += '<\/div>';
    html += '<details class="legal"><summary>Legal<\/summary><div class="legal-text">Targets use the Mifflin-St Jeor formula. Food values are per 100g from USDA FoodData Central, for the food as named (raw or cooked). Where USDA lists no fiber it counts as 0. Brand items use the label for one serving. Recipes change, so check your package, and use a custom food for anything missing. Restaurant items use each chain&rsquo;s published numbers for one item, so log them by count. Fiber counts as 0 where a chain does not list it. Your log is private to you: it saves to your Claude account when you are signed in, and to this browser otherwise. Cutline is not medical advice.<\/div><\/details>';

    return html;
  }

  // ---- Startup state ----
  var LOCAL_KEY='cutline_v2', LEGACY_LOCAL_KEYS=['cutline_share_v1'];  // must be set before the first readLocal()
  function normalize(){ state.profile=state.profile||{}; state.customFoods=state.customFoods||[]; state.weights=state.weights||{}; state.days=state.days||{}; state.flags=state.flags||{}; }
  function adopt(s){ if(!s || !s.profile) return false; var c=cleanState(s); state.profile=c.profile; state.customFoods=c.customFoods; state.weights=c.weights; state.days=c.days; state.flags=c.flags; return true; }
  normalize();
  (function(){ var loc=readLocal(); if(loc) adopt(loc); })();
  var viewDate = todayStr(), lastToday = viewDate;
  function ensureDay(){ if(!state.days[viewDate]) state.days[viewDate]=[]; }
  // The goal timeline counts from goalStart; older saves don't have one, so it starts today.
  function migrateProfile(){ if(!state.profile.goalStart){ state.profile.goalStart=todayStr(); if(!(state.profile.goalWeeks>=GOAL_MIN_WEEKS)) state.profile.goalWeeks=goalWeeksOf(state.profile); return true; } return false; }

  // Day rollover: when the page stays open past midnight, "today" follows the clock.
  function checkDay(){
    var t=todayStr(); if(t===lastToday) return false;
    if(viewDate===lastToday) viewDate=t;
    lastToday=t; ensureDay(); render(); return true;
  }
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) checkDay(); });
  window.addEventListener('focus', checkDay);
  setInterval(checkDay, 60000);

  // ---- Storage ----
  // Each person's log saves to their own Claude account when the page runs inside Claude (a private
  // per-person database), and always to this browser as a backup. The account copy is a small "main"
  // document plus one document per month, so a save writes only what changed, never the whole page.
  var store={mode:'local', col:null, writing:false, pendingMain:false, pendingMonths:{}, failures:0, retry:null, touched:false, status:{kind:'', msg:''}};
  function readLocal(){
    var keys=[LOCAL_KEY].concat(LEGACY_LOCAL_KEYS);
    for(var i=0;i<keys.length;i++){ try{ var v=JSON.parse(localStorage.getItem(keys[i])||'null'); if(v && v.profile) return v; }catch(e){} }
    return null;
  }
  function writeLocal(){ try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); return true; }catch(e){ return false; } }
  function monthOf(d){ return String(d).slice(0,7); }
  function monthsWithEntries(s){ var m={}; Object.keys(s.days||{}).forEach(function(d){ if((s.days[d]||[]).length) m[monthOf(d)]=1; }); return Object.keys(m).sort(); }
  function mainDoc(){ return {json:JSON.stringify({v:2, profile:state.profile, customFoods:state.customFoods, weights:state.weights, flags:state.flags, months:monthsWithEntries(state)}), updated:Date.now()}; }
  function monthDoc(mo){ var days={}; Object.keys(state.days).forEach(function(d){ if(monthOf(d)===mo && (state.days[d]||[]).length) days[d]=state.days[d]; }); return {json:JSON.stringify(days), updated:Date.now()}; }
  function snapJSON(snap){ var v=snap && typeof snap.data==='function' ? snap.data() : snap; return (v && typeof v.json==='string') ? JSON.parse(v.json) : null; }
  function setStatus(kind,msg){ store.status={kind:kind,msg:msg}; var el=$('save-state'); if(el){ el.className='save-state '+kind; el.textContent=msg; } }
  function saveStateHTML(){ return '<p class="save-state '+store.status.kind+'" id="save-state" role="status" aria-live="polite">'+esc(store.status.msg)+'<\/p>'; }
  function queueAll(){ store.pendingMain=true; monthsWithEntries(state).forEach(function(mo){ store.pendingMonths[mo]=1; }); }

  function flush(){
    if(store.mode!=='db' || store.writing) return;
    var months=Object.keys(store.pendingMonths), doMain=store.pendingMain;
    if(!doMain && !months.length) return;
    store.writing=true; store.pendingMain=false; store.pendingMonths={};
    setStatus('saving','Saving...');
    var jobs=months.map(function(mo){ return store.col.doc('m-'+mo).set(monthDoc(mo)); });
    if(doMain) jobs.push(store.col.doc('main').set(mainDoc()));
    Promise.all(jobs).then(function(){
      store.writing=false; store.failures=0;
      setStatus('ok','Saved to your Claude account');
      flush();
    }, function(err){
      store.writing=false; store.failures++;
      if(doMain) store.pendingMain=true;
      months.forEach(function(mo){ store.pendingMonths[mo]=1; });
      console.warn('Cutline: save failed', err);
      setStatus('error', store.failures<=5 ? 'Couldn\'t save to your Claude account. Your entries are kept on this device, and Cutline will retry.' : 'Still can\'t save to your Claude account. Your entries are kept on this device. Export a backup from Profile & targets to be safe.');
      clearTimeout(store.retry);
      if(store.failures<=5) store.retry=setTimeout(flush, Math.min(60000, 2000*Math.pow(2, store.failures-1)));
    });
  }

  // ch.dates: days whose entries changed. The small main document is saved every time.
  function persist(ch){
    ch=ch||{};
    store.touched=true;
    render();
    var okLocal=writeLocal();
    if(store.mode==='db'){
      store.pendingMain=true;
      (ch.dates||[]).forEach(function(d){ store.pendingMonths[monthOf(d)]=1; });
      flush();
    } else {
      setStatus(okLocal?'ok':'error', okLocal ? 'Saved on this device' : 'Couldn\'t save on this device. Export a backup from Profile & targets.');
    }
  }

  // Entries typed before the account copy finished loading are merged in, never dropped.
  function mergeLocalInto(remote){
    Object.keys(state.days).forEach(function(d){
      var ids={}; (remote.days[d]||[]).forEach(function(e){ ids[e.id]=1; });
      var extra=(state.days[d]||[]).filter(function(e){ return !ids[e.id]; });
      if(extra.length) remote.days[d]=(remote.days[d]||[]).concat(extra);
    });
    Object.keys(state.weights).forEach(function(d){ if(remote.weights[d]==null) remote.weights[d]=state.weights[d]; });
    return remote;
  }

  function loadAccount(){
    if(!(window.claude && window.claude.use)) return Promise.resolve(null);
    return Promise.all([window.claude.use('db'), window.claude.use('user')]).then(function(r){
      var db=r[0], user=r[1];
      if(!db || !user) return null;
      return user.id().then(function(id){
        if(!id) return null;
        store.col=db.collection('data/users/'+id);
        return store.col.doc('main').get().then(function(snap){
          var main=snapJSON(snap);
          if(main){
            return Promise.all((main.months||[]).map(function(mo){ return store.col.doc('m-'+mo).get().then(snapJSON); })).then(function(parts){
              var days={}; parts.forEach(function(p){ if(p) Object.keys(p).forEach(function(d){ days[d]=p[d]; }); });
              return {layout:2, state:{profile:main.profile, customFoods:main.customFoods||[], weights:main.weights||{}, flags:main.flags||{}, days:days}};
            });
          }
          // First version of the shared copy kept everything in one document.
          return store.col.doc('cutline').get().then(function(old){ return {layout:1, state:snapJSON(old)}; });
        });
      });
    });
  }

  function startStorage(){
    loadAccount().then(function(res){
      if(!res){ setStatus('ok', scan.insideClaude ? 'Saved on this device' : 'Saved on this device. Export a backup now and then from Profile & targets.'); return; }
      store.mode='db';
      var remote=res.state;
      if(remote && remote.profile){
        remote.days=remote.days||{}; remote.weights=remote.weights||{};
        adopt(store.touched ? mergeLocalInto(remote) : remote);
      }
      // Anything not yet in the per-month layout (a first visit, an older save, or this page's built-in data) is copied up.
      if(res.layout!==2 || !remote || store.touched) queueAll();
      if(migrateProfile()) store.pendingMain=true;
      ensureDay(); writeLocal(); render();
      if(store.pendingMain || Object.keys(store.pendingMonths).length) flush();
      else setStatus('ok','Saved to your Claude account');
    }).catch(function(err){
      console.warn('Cutline: account storage unavailable', err);
      setStatus('error','Couldn\'t reach your Claude account, so this visit saves on this device only.');
    });
  }

  if(migrateProfile()) writeLocal();
  ensureDay();

  function updatePreview(){
    var box=$('pv'); if(!box) return;
    var fq=($('f-food')||{}).value||'', aq=($('f-amt')||{}).value||'';
    if(!fq.trim()){
      box.innerHTML='';
      return;
    }
    var m=findFoods(fq);
    if(!m.length){
      box.innerHTML='<div class="pv-miss">No match for &ldquo;'+esc(fq)+'&rdquo;. Add it once under custom foods below.<\/div>';
      return;
    }
    var food=m[0], head='<div class="pv-title">'+esc(food.n)+'<\/div>';
    var chips=m.slice(1,5).map(function(f){ return '<button type="button" class="chip" data-action="pick-food" data-name="'+esc(f.n)+'">'+esc(f.n)+'<\/button>'; }).join('');
    chips = chips ? '<div class="chips">'+chips+'<\/div>' : '';
    if(!aq.trim()){
      box.innerHTML=head+'<div class="pv-hint">'+(food.per?'One '+esc(food.pc.name):'Per 100g')+': '+R(food.cal)+' kcal &middot; P '+R1(food.p)+'g &middot; net C '+R1(food.c-food.fi)+'g &middot; F '+R1(food.f)+'g.'+pieceNote(food)+' Now enter an amount.<\/div>'+chips;
      return;
    }
    var amt=parseAmount(aq,food);
    if(!amt){
      box.innerHTML=head+'<div class="pv-miss">'+(food.per?'Enter how many you had, like 1 or 2x.':'Amount not understood. Try 179, 6oz, 1lb'+(food.pc?', or 4x':'')+'.')+'<\/div>'+chips;
      return;
    }
    var mac=foodMacros(food,amt.g), t=calcTargets(state.profile), tot=dayTotals(state.days[viewDate]||[]);
    var left=t.calorieTarget-tot.cals-mac.cals, prot=tot.protein+mac.protein, net=tot.carbs-tot.fiber+mac.carbs-mac.fiber;
    function cell(v,k){ return '<div class="pv-cell"><div class="v">'+v+'<\/div><div class="k">'+k+'<\/div><\/div>'; }
    box.innerHTML=head+'<div class="pv-sub">'+esc(amt.label)+'<\/div>' +
      '<div class="pv-grid">'+cell(R(mac.cals),'kcal')+cell(R1(mac.protein)+'g','protein')+cell(R1(mac.carbs-mac.fiber)+'g','net carbs')+cell(R1(mac.fat)+'g','fat')+'<\/div>' +
      '<div class="pv-after">After logging: protein <b>'+R(prot)+'<\/b> / '+R(t.proteinG)+'g &middot; <b>'+N(left)+'<\/b> kcal left &middot; net carbs <b>'+R1(net)+'<\/b> / '+R(t.netCarbG)+'g<\/div>'+chips;
  }

  function render(){
    resolveCache.clear();
    $('app-root').innerHTML = renderApp(state, viewDate);
    var sd=$('s-date'); if(sd) sd.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    updatePreview();
  }

  document.addEventListener('input', function(ev){
    if(ev.target && (ev.target.id==='f-food' || ev.target.id==='f-amt')) updatePreview();
    if(ev.target && ev.target.id==='ed-amt') updateEditFromAmount();
  });

  document.addEventListener('click', function(ev){
    var t = ev.target.closest('[data-action]');
    if(!t) return;
    var action = t.getAttribute('data-action');
    if(action==='tab'){ tab=t.getAttribute('data-tab')||'log'; editingId=null; render(); window.scrollTo(0,0); return; }
    if(action==='edit-entry'){ editingId=t.getAttribute('data-id'); render(); var ea=$('ed-amt')||$('ed-cal'); if(ea) ea.focus(); return; }
    if(action==='cancel-edit'){ editingId=null; render(); return; }
    if(action==='ms-dismiss' || action==='ms-review'){ state.flags.milestone14=todayStr(); if(action==='ms-review') tab='history'; persist(); if(action==='ms-review'){ var ad=$('adapt'); if(ad) ad.scrollIntoView(); } return; }
    if(action==='adapt-apply'){ var adj=parseInt(t.getAttribute('data-adj'),10); if(isFinite(adj)){ state.profile.tdeeAdjust=adj; state.profile.tdeeAdjustDate=todayStr(); if(draft){ draft.tdeeAdjust=adj; draft.tdeeAdjustDate=state.profile.tdeeAdjustDate; } persist(); } return; }
    if(action==='adapt-undo'){ delete state.profile.tdeeAdjust; delete state.profile.tdeeAdjustDate; if(draft){ delete draft.tdeeAdjust; delete draft.tdeeAdjustDate; } persist(); return; }
    if(action==='scan-start'){ if(!(scan.sample && scan.images) && !('BarcodeDetector' in window)){ showManualCode(scan.insideClaude ? 'Scanning isn\'t available here. Enter the label numbers by hand.' : 'This browser can\'t read barcodes from photos. Type the number under the barcode.'); return; } var f=$('scan-file'); if(f){ f.value=''; f.click(); } return; }
    if(action==='scan-manual'){ showManualCode('Type the number printed under the barcode.'); return; }
    if(action==='scan-lookup'){ lookupBarcode(($('scan-num')||{}).value); return; }
    if(action==='export'){ exportBackup(); return; }
    if(action==='import-start'){ var fi=$('import-file'); if(fi){ fi.value=''; fi.click(); } return; }
    if(action==='import-cancel'){ pendingImport=null; render(); return; }
    if(action==='import-confirm'){ if(!pendingImport) return; var ns=pendingImport.state; pendingImport=null; adopt(ns); migrateProfile(); draft=null; editingId=null; ensureDay(); queueAll(); persist(); backupMsg('Backup restored.'); return; }
    if(action==='save-profile'){
      if(!draft) return;
      var oldW=state.profile.weightLb;
      if(!(draft.goalWeeks>=GOAL_MIN_WEEKS)) draft.goalWeeks=goalWeeksOf(draft);
      if(!draft.goalStart) draft.goalStart=todayStr();
      state.profile=draft; draft=null;
      if(state.profile.weightLb>0 && state.profile.weightLb!==oldW) state.weights[todayStr()]=state.profile.weightLb;
      persist();
      var st=$('prof-status'); if(st) st.textContent='Saved. Your targets are updated.';
      return;
    }
    if(action==='discard-profile'){ draft=null; render(); return; }
    if(action==='prev-day'){ viewDate = shiftDate(viewDate,-1); if(!state.days[viewDate]) state.days[viewDate]=[]; render(); }
    else if(action==='next-day'){ viewDate = shiftDate(viewDate,1); if(!state.days[viewDate]) state.days[viewDate]=[]; render(); }
    else if(action==='goto-day'){ tab='food';
      viewDate = t.getAttribute('data-date');
      if(!state.days[viewDate]) state.days[viewDate]=[];
      render();
      window.scrollTo(0,0);
    }
    else if(action==='del-entry'){
      var id = t.getAttribute('data-id');
      state.days[viewDate] = (state.days[viewDate]||[]).filter(function(e){ return e.id!==id; });
      if(editingId===id) editingId=null;
      persist({dates:[viewDate]});
    }
    else if(action==='del-custom'){
      var i = parseInt(t.getAttribute('data-i'),10);
      if(i>=0 && i<state.customFoods.length){ state.customFoods.splice(i,1); persist(); }
    }
    else if(action==='pick-food'){
      $('f-food').value = t.getAttribute('data-name');
      updatePreview();
      $('f-amt').focus();
    }
    else if(action==='pick-usual'){
      $('f-food').value = t.getAttribute('data-name');
      $('f-amt').value = t.getAttribute('data-amt');
      updatePreview();
      $('f-amt').focus();
    }
  });

  function onProfileEdit(ev){
    var t=ev.target && ev.target.closest ? ev.target.closest('[data-field]') : null;
    if(!t) return;
    var field=t.getAttribute('data-field'), d=draft||(draft=JSON.parse(JSON.stringify(state.profile)));
    if(t.type==='checkbox') d[field]=t.checked;
    else if(field==='sex'||field==='dietMode') d[field]=t.value;
    else if(field==='age') d.age=t.value?parseInt(t.value,10):null;
    else if(field==='goalWeeks') d.goalWeeks=parseInt(t.value,10);
    else d[field]=parseFloat(t.value)||0;
    if(field==='goalWeeks' || field==='goalWeightLb') d.goalStart=todayStr();
    updateProfilePreview();
  }
  document.addEventListener('change', function(ev){
    var el=ev.target; if(!el || !el.files || !el.files[0]) return;
    if(el.id==='scan-file'){ if(scan.sample && scan.images) readLabel(el.files[0]); else readBarcode(el.files[0]); }
    if(el.id==='import-file') readImport(el.files[0]);
  });
  // Tabs: arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
  document.addEventListener('keydown', function(ev){
    var el=ev.target; if(!el || !el.classList || !el.classList.contains('tab')) return;
    var ids=TABS.map(function(x){ return x[0]; }), i=ids.indexOf(tab), k=ev.key, next=null;
    if(k==='ArrowRight') next=ids[(i+1)%ids.length]; else if(k==='ArrowLeft') next=ids[(i-1+ids.length)%ids.length];
    else if(k==='Home') next=ids[0]; else if(k==='End') next=ids[ids.length-1];
    if(!next) return;
    ev.preventDefault(); tab=next; editingId=null; render(); var nb=$('tab-'+next); if(nb) nb.focus();
  });
  document.addEventListener('input', onProfileEdit);
  document.addEventListener('change', onProfileEdit);

  document.addEventListener('submit', function(ev){
    var form = ev.target.closest('[data-action]');
    if(!form) return;
    var action = form.getAttribute('data-action');
    if(action==='save-weight'){
      ev.preventDefault();
      checkDay();
      var wv=parseFloat(($('w-today')||{}).value), wn=$('weigh-note');
      if(!(wv>=50 && wv<=1000)){ if(wn){ wn.textContent='Enter your weight in pounds, between 50 and 1,000.'; wn.className='weigh-note bad'; } return; }
      wv=R1(wv); state.weights[todayStr()]=wv;
      var lw=latestWeight(); if(lw && lw.d===todayStr()){ state.profile.weightLb=wv; if(draft) draft.weightLb=wv; }
      persist();
      return;
    }
    if(action==='save-edit'){
      ev.preventDefault();
      var eid=form.getAttribute('data-id'), list=state.days[viewDate]||[], ent=list.filter(function(x){ return x.id===eid; })[0];
      if(!ent){ editingId=null; render(); return; }
      var efood=foodByName(ent.name), eamt=(efood && $('ed-amt')) ? parseAmount($('ed-amt').value, efood) : null;
      if(efood && $('ed-amt') && $('ed-amt').value.trim() && !eamt){ updateEditFromAmount(); return; }
      if(eamt) ent.portion=eamt.label;
      ent.cals=num1($('ed-cal').value); ent.protein=num1($('ed-p').value); ent.carbs=num1($('ed-c').value); ent.fiber=num1($('ed-fi').value); ent.fat=num1($('ed-f').value);
      editingId=null;
      persist({dates:[viewDate]});
      return;
    }
    if(action==='add-entry'){
      ev.preventDefault();
      checkDay();
      var food = findFoods($('f-food').value)[0];
      if(!food){ updatePreview(); return; }
      if(!$('f-amt').value.trim()){ $('f-amt').focus(); updatePreview(); return; }
      var amt = parseAmount($('f-amt').value, food);
      if(!amt){ updatePreview(); return; }
      var mac = foodMacros(food, amt.g);
      if(!state.days[viewDate]) state.days[viewDate]=[];
      state.days[viewDate].push({
        id: 'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
        name: food.n, portion: amt.label,
        cals: R1(mac.cals), protein: R1(mac.protein), carbs: R1(mac.carbs), fiber: R1(mac.fiber), fat: R1(mac.fat)
      });
      persist({dates:[viewDate]});
      $('f-food').focus();
    }
    else if(action==='add-custom'){
      ev.preventDefault();
      var fd = new FormData(form), name = (fd.get('name')||'').trim();
      var serv = parseFloat(fd.get('serving'));
      if(!name || !(serv>0)) return;
      var k = 100/serv;
      state.customFoods.push({n:name, a:[], cal:(parseFloat(fd.get('cal'))||0)*k, p:(parseFloat(fd.get('protein'))||0)*k, c:(parseFloat(fd.get('carbs'))||0)*k, fi:(parseFloat(fd.get('fiber'))||0)*k, f:(parseFloat(fd.get('fat'))||0)*k, pc:{name:'serving', g:serv}});
      persist();
      $('f-food').value = name;
      updatePreview();
      $('f-amt').focus();
    }
  });

  render();
  startStorage();
  if(scan.insideClaude){
    window.claude.use('sample').then(function(sm){ if(!sm) return; scan.sample=sm; return (sm.limits ? sm.limits() : Promise.resolve({})).then(function(l){ scan.images=!!(l && l.images); var b=$('scan-btn'); if(b) b.textContent=scanLabelText(); }); }).catch(function(){});
    window.claude.use('downloads').then(function(d){ downloadsApi=d||null; }).catch(function(){});
  }
