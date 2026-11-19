// Pure helpers: formatting, dates, targets, search and amounts. No DOM access here, so tests can load it.
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function R(n){ return Math.round(n); }
  function R1(n){ return Math.round(n*10)/10; }
  function N(n){ return R(n).toLocaleString('en-US'); }
  function $(id){ return document.getElementById(id); }

  function todayStr(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function shiftDate(dateStr,days){ var d=new Date(dateStr+'T00:00:00'); d.setDate(d.getDate()+days); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function prettyDate(dateStr){ var d=new Date(dateStr+'T00:00:00'); return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); }

  var ACTIVITY=[
    {v:1.2,label:'Sedentary (little or no exercise)'},
    {v:1.375,label:'Light (exercise 1-3 days/wk)'},
    {v:1.55,label:'Moderate (exercise 3-5 days/wk)'},
    {v:1.725,label:'Very active (hard exercise 6-7 days/wk)'},
    {v:1.9,label:'Extremely active (physical job + training)'}
  ];

  function lbToKg(lb){ return lb*0.45359237; }
  function inToCm(inch){ return inch*2.54; }

  function calcBMR(p){
    var kg=lbToKg(p.weightLb||0), cm=inToCm(p.heightIn||0), age=p.age||35;
    var sexTerm = p.sex==='male'?5 : p.sex==='female'?-161 : -78;
    return 10*kg+6.25*cm-5*age+sexTerm;
  }
  // Goal plan: the deficit comes from current weight, goal weight and the chosen timeline (6-26 weeks).
  var GOAL_MIN_WEEKS=6, GOAL_MAX_WEEKS=26;
  function goalWeeksOf(p){
    var w=p.goalWeeks;
    if(!(w>=GOAL_MIN_WEEKS)){ var d=(p.weightLb||0)-(p.goalWeightLb||0); w=(d>0&&p.deficit>0)?Math.round(d*3500/(p.deficit*7)):12; }
    return Math.min(GOAL_MAX_WEEKS,Math.max(GOAL_MIN_WEEKS,w));
  }
  function calorieFloor(p){ return p.sex==='male'?1500:p.sex==='female'?1200:1350; }
  // Whole-day number for a YYYY-MM-DD date (UTC-based, so daylight saving never shifts it).
  function dayNum(d){ var a=String(d).split('-'); return Math.round(Date.UTC(+a[0],+a[1]-1,+a[2])/864e5); }

  // Targets. The goal timeline starts on goalStart, so the daily deficit is recalculated from the
  // weight still to lose and the days left. tdeeAdjust is the correction learned from real results.
  function calcTargets(p,today){
    today=today||todayStr();
    var bmr=calcBMR(p), formulaTdee=bmr*(p.activity||1.2), tdee=formulaTdee+(p.tdeeAdjust||0);
    var weeks=goalWeeksOf(p), delta=(p.weightLb||0)-(p.goalWeightLb||0);
    if(Math.abs(delta)<0.5) delta=0;
    var totalDays=weeks*7, elapsed=Math.max(0, dayNum(today)-dayNum(p.goalStart||today));
    var daysLeft=Math.max(7, totalDays-elapsed), ended=elapsed>=totalDays;
    var needed=delta*3500/daysLeft, deficit=needed, floor=calorieFloor(p), limited='';
    if(deficit<-500){ deficit=-500; limited='surplus'; }
    if(deficit>0 && tdee-deficit<floor){ deficit=Math.max(0,tdee-floor); limited='floor'; }
    var calorieTarget=tdee-deficit, lbPerWeek=deficit*7/3500;
    var weeksActual=delta && Math.abs(lbPerWeek)>0.01 ? Math.abs(delta/lbPerWeek) : null;
    var proteinG=(p.goalWeightLb||p.weightLb||0)*1;
    if(p.proteinFloorEnabled) proteinG=Math.max(proteinG,p.proteinFloorG||0);
    var netCarbG = p.netCarbLimit>0 ? p.netCarbLimit : (p.dietMode==='lowcarb'?75:25);
    var fatG=Math.max(0,(calorieTarget-proteinG*4-netCarbG*4)/9);
    return {bmr:bmr,formulaTdee:formulaTdee,tdee:tdee,calorieTarget:calorieTarget,proteinG:proteinG,netCarbG:netCarbG,fatG:fatG,deficit:deficit,needed:needed,weeks:weeks,weeksActual:weeksActual,lbPerWeek:lbPerWeek,delta:delta,floor:floor,limited:limited,elapsed:elapsed,daysLeft:daysLeft,totalDays:totalDays,ended:ended};
  }

  // Least-squares slope of weight over time, in lb per day. pts: [[dayNumber, weight], ...]
  function slopePerDay(pts){
    var n=pts.length; if(n<2) return 0;
    var sx=0,sy=0,sxx=0,sxy=0;
    pts.forEach(function(q){ sx+=q[0]; sy+=q[1]; sxx+=q[0]*q[0]; sxy+=q[0]*q[1]; });
    var den=n*sxx-sx*sx; return den ? (n*sxy-sx*sy)/den : 0;
  }

  // Real-world maintenance from the last 28 days: average logged intake plus the energy implied by the
  // weight trend (about 3,500 kcal per lb). Needs 10 logged days and 3 weigh-ins spread over 10+ days.
  var ADAPT_MIN_LOGGED=14, ADAPT_WINDOW=28, ADAPT_MIN_DAYS=10, ADAPT_MIN_WEIGHINS=3, ADAPT_MIN_SPAN=10, ADAPT_CLAMP=0.25;
  function adaptiveEstimate(st,today){
    today=today||todayStr();
    var start=shiftDate(today,-ADAPT_WINDOW);
    var days=Object.keys(st.days||{}).filter(function(d){ return d>=start && d<today && (st.days[d]||[]).length; }).sort();
    var wk=Object.keys(st.weights||{}).filter(function(d){ return d>=start && d<=today; }).sort();
    var span=wk.length>1 ? dayNum(wk[wk.length-1])-dayNum(wk[0]) : 0;
    var res={logged:days.length, weighIns:wk.length, span:span, ready:false};
    if(days.length<ADAPT_MIN_DAYS || wk.length<ADAPT_MIN_WEIGHINS || span<ADAPT_MIN_SPAN) return res;
    var intake=days.reduce(function(a,d){ return a+dayTotals(st.days[d]).cals; },0)/days.length;
    var slope=slopePerDay(wk.map(function(d){ return [dayNum(d), st.weights[d]]; }));
    res.ready=true; res.intake=intake; res.slope=slope; res.estimate=intake-slope*3500;
    return res;
  }
  function clampedAdjust(estimate, formulaTdee){
    var lo=formulaTdee*(1-ADAPT_CLAMP), hi=formulaTdee*(1+ADAPT_CLAMP), v=Math.min(hi,Math.max(lo,estimate));
    return {value:v, adjust:Math.round(v-formulaTdee), clamped:v!==estimate};
  }

  function dayTotals(entries){
    return entries.reduce(function(a,e){ a.cals+=e.cals; a.protein+=e.protein; a.carbs+=e.carbs; a.fiber+=e.fiber||0; a.fat+=e.fat; return a; },{cals:0,protein:0,carbs:0,fiber:0,fat:0});
  }

  // Food lookup: every word typed must appear in the name or an alias (plural-tolerant). Exact alias match ranks first.
  function NORM(s){ return (s||'').toLowerCase().replace(/['’]/g,'').replace(/-/g,' ').replace(/[àáâ]/g,'a').replace(/[èéê]/g,'e').replace(/[íì]/g,'i').replace(/ñ/g,'n').replace(/ç/g,'c').trim(); }
  function findFoods(q){
    q=NORM(q);
    if(!q) return [];
    var toks=q.split(/[\s,]+/).filter(Boolean), out=[];
    (state.customFoods||[]).concat(FOODS).forEach(function(f){
      var names=[f.n].concat(f.a||[]).map(NORM);
      var hay=names.join(' | ');
      var ok=toks.every(function(t){ return hay.indexOf(t)>-1 || hay.indexOf(t.replace(/(es|s)$/,''))>-1; });
      if(!ok) return;
      var score = names.indexOf(q)>-1 ? 0 : names.some(function(n){return n.indexOf(q)===0;}) ? 1 : 2;
      out.push({f:f,s:score,l:f.n.length});
    });
    out.sort(function(a,b){ return a.s-b.s || a.l-b.l; });
    return out.map(function(o){return o.f;});
  }

  // Amount: "179", "179g", "6oz", "1lb", or pieces ("4x", "4 eggs"). A bare number up to 12 counts as pieces for foods that have a piece size.
  function parseAmount(s,food){
    s=(s||'').toLowerCase().trim();
    var m=s.match(/^(\d*\.?\d+)\s*([a-z]*)$/);
    if(!m) return null;
    var n=parseFloat(m[1]), u=m[2], W={g:1,gram:1,grams:1,oz:28.3495,lb:453.592,lbs:453.592,kg:1000};
    if(food && food.per){ if(u && W[u]!==undefined) return null; return {g:n*100, label:R1(n)+' × '+food.pc.name}; }
    if(u && W[u]!==undefined) return {g:n*W[u], label:R1(n)+u.replace('gram','g').replace('gs','g')};
    if(food && food.pc && (u || n<=12)) return {g:n*food.pc.g, label:R1(n)+' × '+food.pc.name+' ('+R(n*food.pc.g)+'g)'};
    if(u) return null;
    return {g:n, label:R1(n)+'g'};
  }

  function pieceNote(f){ if(!f.pc || f.per) return ''; var k=f.pc.g/100; return ' One '+f.pc.name+' ('+R(f.pc.g)+'g): '+R(f.cal*k)+' kcal, P '+R1(f.p*k)+'g.'; }

  function foodMacros(food,grams){
    var k=grams/100;
    return {cals:food.cal*k, protein:food.p*k, carbs:food.c*k, fiber:food.fi*k, fat:food.f*k};
  }

