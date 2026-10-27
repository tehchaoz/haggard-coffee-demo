(function(){
  var H=window.HG,d=document,esc=H.esc;
  function $(s,r){return (r||d).querySelector(s)}
  function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
  var toastT;
  function toast(t,bad){var e=$('#toast');e.textContent=t;e.className='toast on'+(bad?' bad':'');clearTimeout(toastT);toastT=setTimeout(function(){e.className='toast'},2200)}
  function saved(ok){ok?toast('Saved'):toast('Could not save: browser storage is full. Remove some photos.',true);return ok}

  /* ---------- login ---------- */
  var authed=false;try{authed=sessionStorage.getItem('hg.auth')==='1'}catch(e){}
  var first=false; // demo: password defaults to Coldbrew, changeable in Settings
  function showApp(){$('#login').hidden=true;$('#app').hidden=false;renderAll()}
  function showLogin(){
    $('#login').hidden=false;$('#app').hidden=true;
    $('#pw2wrap').hidden=!first;$('#pw2').required=first;
    $('#loginkicker').textContent=first?'First time here? Set a password':'Owner login';
    $('#loginbtn').textContent=first?'Create password':'Log in';
    $('#pw').autocomplete=first?'new-password':'current-password';
    $('#pw').minLength=first?6:1;
    $('#loginhint').textContent=first?'Pick something you will remember (6+ characters). It is saved as a hash in this browser.':'Demo login. This only guards the screen in this browser.';
  }
  $('#loginform').addEventListener('submit',function(e){
    e.preventDefault();var pw=$('#pw').value,msg=$('#loginmsg');msg.textContent='';
    if(first){
      if(pw.length<6){msg.textContent='Use at least 6 characters.';return}
      if(pw!==$('#pw2').value){msg.textContent='Passwords do not match.';return}
      H.hash(pw).then(function(h){H.setPw(h);first=false;try{sessionStorage.setItem('hg.auth','1')}catch(e){}showApp()});
    }else{
      H.checkPw(pw).then(function(ok){
        if(ok){try{sessionStorage.setItem('hg.auth','1')}catch(e){}$('#pw').value='';showApp()}
        else{msg.textContent='That is not the password.'}
      });
    }
  });
  $('#logout').addEventListener('click',function(){try{sessionStorage.removeItem('hg.auth')}catch(e){}location.reload()});
  if(authed&&!first)showApp();else showLogin();

  /* ---------- tabs ---------- */
  function tab(n){
    $$('.a-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===n)});
    $$('.a-pane').forEach(function(p){p.hidden=p.id!=='tab-'+n});
    if(n==='reports')renderReports();if(n==='orders')renderOrders();if(n==='data')renderData();if(n==='settings')renderSettings();
    try{history.replaceState(null,'','#'+n)}catch(e){}
  }
  $$('.a-tabs button').forEach(function(b){b.addEventListener('click',function(){tab(b.dataset.tab)})});
  function renderAll(){renderProducts();renderOrderBadge();var h=location.hash.slice(1);if(['orders','reports','settings','data'].indexOf(h)>-1)tab(h)}

  /* ---------- products ---------- */
  function renderStats(all){
    var low=all.filter(function(p){return p.stock>0&&p.stock<=5}).length,out=all.filter(function(p){return p.stock<=0}).length;
    var os=H.orders(),rev=os.filter(function(o){return o.status!=='cancelled'}).reduce(function(a,o){return a+o.total},0);
    $('#stats').innerHTML=[[all.length,'Products'],[all.filter(function(p){return p.published!==false}).length,'Live in shop'],[low+' / '+out,'Low / out of stock'],[os.length,'Orders (demo)'],[H.money2(rev),'Demo revenue']]
      .map(function(s){return '<div class="stat"><b>'+s[0]+'</b><span>'+s[1]+'</span></div>'}).join('');
  }
  function renderProducts(){
    var all=H.products({all:true});renderStats(all);
    var q=$('#q').value.trim().toLowerCase(),c=$('#cat').value;
    var list=all.filter(function(p){return (!c||p.category===c)&&(!q||(p.name+' '+p.desc).toLowerCase().indexOf(q)>-1)});
    $('#plist').innerHTML=list.length?list.map(function(p){
      var th=p.images&&p.images[0]?'<img src="'+esc(p.images[0])+'" alt="">':'<img class="ph" src="img/wolf.png" alt="">';
      var st=p.stock<=0?'<small class="low">Sold out</small>':p.stock<=5?'<small class="low">Low stock</small>':'<small>'+(p.category==='coffee'?'Coffee':'Merch')+(p.featured?' · Featured':'')+'</small>';
      return '<div class="prow'+(p.published===false?' hidden-p':'')+'" data-id="'+esc(p.id)+'"><div class="a-thumb">'+th+'</div>'+
        '<div class="pn">'+esc(p.name)+st+'</div>'+
        '<label class="mini f-price">Price $<input type="number" step="0.01" min="0" value="'+p.price+'" data-f="price" aria-label="Price for '+esc(p.name)+'"></label>'+
        '<label class="mini f-stock">Stock<input type="number" step="1" min="0" value="'+p.stock+'" data-f="stock" aria-label="Stock for '+esc(p.name)+'"></label>'+
        '<label class="pub"><input type="checkbox" class="sw" data-f="published"'+(p.published!==false?' checked':'')+' aria-label="Show '+esc(p.name)+' in shop"> Live</label>'+
        '<div class="acts"><button class="ib" data-a="edit">Edit</button><button class="ib" data-a="dup">Duplicate</button><button class="ib del" data-a="del">Delete</button></div></div>';
    }).join(''):'<div class="empty"><img src="img/wolf.png" alt=""><p>No products match. Add your first one!</p></div>';
  }
  $('#q').addEventListener('input',renderProducts);$('#cat').addEventListener('change',renderProducts);
  $('#plist').addEventListener('change',function(e){
    var f=e.target.dataset.f;if(!f)return;
    var row=e.target.closest('.prow'),p=H.product(row.dataset.id);if(!p)return;
    if(f==='published')p.published=e.target.checked;
    else{var v=parseFloat(e.target.value);if(isNaN(v)||v<0){toast('Enter a number',true);renderProducts();return}p[f]=f==='stock'?Math.round(v):Math.round(v*100)/100}
    if(saved(H.saveProduct(p)))renderProducts();
  });
  $('#plist').addEventListener('click',function(e){
    var b=e.target.closest('[data-a]');if(!b)return;
    var id=b.closest('.prow').dataset.id,p=H.product(id);
    if(b.dataset.a==='edit')openEditor(p);
    if(b.dataset.a==='dup'){var c=JSON.parse(JSON.stringify(p));c.name+=' (copy)';c.id='';c.published=false;if(saved(H.saveProduct(c)))renderProducts()}
    if(b.dataset.a==='del'&&confirm('Delete "'+p.name+'"? This cannot be undone.')){H.deleteProduct(id);toast('Deleted');renderProducts()}
  });
  $('#addbtn').addEventListener('click',function(){openEditor(null)});

  /* ---------- editor ---------- */
  var ed,photos=[];
  var dlg=$('#editor'),form=$('#edform');
  function openEditor(p){
    ed=p?JSON.parse(JSON.stringify(p)):{id:'',name:'',category:'coffee',price:'',compareAt:'',stock:10,desc:'',images:[],featured:false,published:true,badge:'',optionLabel:'',options:[],meta:''};
    $('#edtitle').textContent=p?'Edit product':'Add product';$('#edmsg').textContent='';
    var f=form.elements;
    f.name.value=ed.name;f.category.value=ed.category;f.meta.value=ed.meta||'';f.price.value=ed.price;f.compareAt.value=ed.compareAt||'';
    f.stock.value=ed.stock;f.desc.value=ed.desc||'';f.optionLabel.value=ed.optionLabel||'';f.options.value=(ed.options||[]).join(', ');f.badge.value=ed.badge||'';
    f.published.checked=ed.published!==false;f.featured.checked=!!ed.featured;
    photos=(ed.images||[]).slice();renderPhotos();
    dlg.showModal();f.name.focus();
  }
  function closeEditor(){dlg.close()}
  $('#edclose').addEventListener('click',closeEditor);$('#edcancel').addEventListener('click',closeEditor);
  function renderPhotos(){
    $('#photos').innerHTML=photos.map(function(s,i){
      return '<div class="ph-item" data-i="'+i+'"><img src="'+esc(s)+'" alt="Photo '+(i+1)+'">'+(i?'':'<span class="main">MAIN</span>')+
        '<div class="ctl"><button type="button" data-p="l" aria-label="Move earlier"'+(i?'':' disabled')+'>←</button><button type="button" class="x" data-p="x" aria-label="Remove photo">✕</button><button type="button" data-p="r" aria-label="Move later"'+(i<photos.length-1?'':' disabled')+'>→</button></div></div>';
    }).join('');
  }
  $('#photos').addEventListener('click',function(e){
    var b=e.target.closest('[data-p]');if(!b)return;var i=+b.closest('.ph-item').dataset.i;
    if(b.dataset.p==='x')photos.splice(i,1);
    if(b.dataset.p==='l'&&i>0){photos.splice(i-1,0,photos.splice(i,1)[0])}
    if(b.dataset.p==='r'&&i<photos.length-1){photos.splice(i+1,0,photos.splice(i,1)[0])}
    renderPhotos();
  });
  function shrink(file){
    return new Promise(function(res,rej){
      if(!/^image\//.test(file.type))return rej(new Error(file.name+' is not an image'));
      var url=URL.createObjectURL(file),im=new Image();
      im.onload=function(){
        var max=1200,r=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=d.createElement('canvas');
        c.width=Math.round(im.naturalWidth*r);c.height=Math.round(im.naturalHeight*r);
        var x=c.getContext('2d');x.fillStyle='#151513';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
        URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',.82));
      };
      im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('Could not read '+file.name+'. Try a JPG or PNG.'))};
      im.src=url;
    });
  }
  function addFiles(fl){
    var files=[].slice.call(fl);if(!files.length)return;
    $('#photonote').textContent='Processing '+files.length+' photo'+(files.length>1?'s':'')+'…';
    Promise.all(files.map(function(f){return shrink(f).catch(function(e){$('#edmsg').textContent=e.message;return null})})).then(function(r){
      r.filter(Boolean).forEach(function(s){photos.push(s)});renderPhotos();
      $('#photonote').textContent='Photos are resized to 1200px and compressed automatically.';
    });
  }
  var drop=$('#drop'),fin=$('#files');
  drop.addEventListener('click',function(){fin.click()});
  drop.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fin.click()}});
  fin.addEventListener('change',function(){addFiles(fin.files);fin.value=''});
  ['dragenter','dragover'].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.add('over')})});
  ['dragleave','drop'].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.remove('over')})});
  drop.addEventListener('drop',function(e){addFiles(e.dataTransfer.files)});
  $('#urladd').addEventListener('click',function(){
    var u=$('#urlin').value.trim();if(!/^https?:\/\//i.test(u)&&!/^img\//.test(u)){$('#edmsg').textContent='Enter a full image link starting with https://';return}
    photos.push(u);$('#urlin').value='';$('#edmsg').textContent='';renderPhotos();
  });
  form.addEventListener('submit',function(e){
    e.preventDefault();var f=form.elements,msg=$('#edmsg');msg.textContent='';
    var price=parseFloat(f.price.value),stock=parseInt(f.stock.value,10);
    if(!f.name.value.trim()){msg.textContent='Give it a name.';return}
    if(isNaN(price)||price<0){msg.textContent='Enter a price.';return}
    var p=ed;
    p.name=f.name.value.trim();p.category=f.category.value;p.meta=f.meta.value.trim();p.price=Math.round(price*100)/100;
    p.compareAt=parseFloat(f.compareAt.value)||0;p.stock=isNaN(stock)?0:Math.max(0,stock);p.desc=f.desc.value.trim();
    p.optionLabel=f.optionLabel.value.trim();p.options=f.options.value.split(',').map(function(s){return s.trim()}).filter(Boolean);
    if(p.options.length&&!p.optionLabel)p.optionLabel='Option';
    p.badge=f.badge.value.trim();p.published=f.published.checked;p.featured=f.featured.checked;p.images=photos.slice();
    var r=H.saveProduct(p);
    if(!r){msg.textContent='Browser storage is full. Remove a few photos and try again.';return}
    closeEditor();toast(ed.id&&H.product(r.id)?'Saved':'Saved');renderProducts();
  });

  /* ---------- orders ---------- */
  function renderOrderBadge(){
    var n=H.orders().filter(function(o){return o.status==='new'}).length,b=$('#newcount');b.hidden=!n;b.textContent=n;
  }
  function renderOrders(){
    var os=H.orders();renderOrderBadge();
    $('#olist').innerHTML=os.length?'<div class="otable">'+os.map(function(o,i){
      var dt=new Date(o.date).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
      return '<details class="orow"><summary><span class="on">'+esc(o.number)+'</span><span>'+esc(o.customer.name||o.customer.email)+'<br><span class="od">'+dt+' · '+(o.method==='pickup'?'Pickup':'Ship')+' · '+o.items.reduce(function(a,x){return a+x.qty},0)+' items</span></span><b>'+H.money2(o.total)+'</b>'+
        '<select data-i="'+i+'" aria-label="Status for '+esc(o.number)+'">'+['new','packed','fulfilled','cancelled'].map(function(s){return '<option'+(o.status===s?' selected':'')+'>'+s+'</option>'}).join('')+'</select></summary>'+
        '<div class="obody">'+o.items.map(function(it){return '<div class="sl"><div class="nm">'+esc(it.name)+(it.opt?'<small>'+esc(it.opt)+'</small>':'')+' × '+it.qty+'</div><b>'+H.money2(it.price*it.qty)+'</b></div>'}).join('')+
        '<dl><dt>Subtotal</dt><dd>'+H.money2(o.sub)+'</dd><dt>Shipping</dt><dd>'+H.money2(o.ship)+'</dd><dt>Tax</dt><dd>'+H.money2(o.tax)+'</dd></dl>'+
        '<div class="meta2"><div><h4>Customer</h4>'+esc(o.customer.name)+'<br>'+esc(o.customer.email)+(o.customer.phone?'<br>'+esc(o.customer.phone):'')+'</div>'+
        '<div><h4>'+(o.method==='pickup'?'Pickup':'Ship to')+'</h4>'+(o.address?esc(o.address.line1)+'<br>'+esc(o.address.city)+', '+esc(o.address.state)+' '+esc(o.address.zip):'In store, Brooksville')+'</div>'+
        (o.note?'<div><h4>Note</h4>'+esc(o.note)+'</div>':'')+'</div><span class="badge-demo">DEMO ORDER · no payment taken</span></div></details>';
    }).join('')+'</div>':'<div class="empty"><img src="img/wolf.png" alt=""><p>No orders yet. Place a demo order on the storefront to see it here.</p></div>';
  }
  $('#olist').addEventListener('change',function(e){
    if(e.target.tagName!=='SELECT')return;var os=H.orders();os[+e.target.dataset.i].status=e.target.value;H.saveOrders(os);renderOrderBadge();renderStats(H.products({all:true}));toast('Order updated');
  });
  $('#olist').addEventListener('click',function(e){if(e.target.tagName==='SELECT')e.preventDefault()});
  $('#csv').addEventListener('click',function(){
    var os=H.orders();if(!os.length){toast('No orders yet',true);return}
    var q=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'};
    var rows=[['Order','Date','Status','Method','Name','Email','Phone','Items','Subtotal','Shipping','Tax','Total','Address']].concat(os.map(function(o){
      return [o.number,o.date,o.status,o.method,o.customer.name,o.customer.email,o.customer.phone,o.items.map(function(i){return i.qty+'x '+i.name+(i.opt?' ('+i.opt+')':'')}).join('; '),o.sub,o.ship,o.tax,o.total,o.address?o.address.line1+', '+o.address.city+', '+o.address.state+' '+o.address.zip:'Pickup']}));
    download('haggard-orders.csv','text/csv',rows.map(function(r){return r.map(q).join(',')}).join('\n'));
  });


  /* ---------- reports ---------- */
  var DAY=864e5;
  function dayStart(t){var x=new Date(t);x.setHours(0,0,0,0);return x.getTime()}
  function pct(a,b){if(!b)return a?'new':'';var v=(a-b)/b*100;return (v>=0?'▲ ':'▼ ')+Math.abs(Math.round(v))+'%'}
  function sums(os){
    var r={rev:0,n:0,units:0,pick:0};
    os.forEach(function(o){r.rev+=o.total;r.n++;r.units+=o.items.reduce(function(a,i){return a+i.qty},0);if(o.method==='pickup')r.pick++});
    r.aov=r.n?r.rev/r.n:0;return r;
  }
  function niceMax(v){if(v<=0)return 10;var p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return (f<=1?1:f<=2?2:f<=3?3:f<=4?4:f<=5?5:10)*p}
  function chart(os,days){
    var end=dayStart(Date.now()),first=days?end-(days-1)*DAY:Math.min.apply(null,os.map(function(o){return dayStart(new Date(o.date))}).concat([end]));
    var span=Math.round((end-first)/DAY)+1,step=span>45?7:1,buckets=[];
    for(var t=first;t<=end;t+=step*DAY)buckets.push({t:t,v:0,n:0});
    os.forEach(function(o){var d0=dayStart(new Date(o.date)),i=Math.min(buckets.length-1,Math.floor((d0-first)/DAY/step));if(i>=0){buckets[i].v+=o.total;buckets[i].n++}});
    var W=760,Ht=240,L=48,B=30,T=14,R=10,iw=W-L-R,ih=Ht-T-B,mx=niceMax(Math.max.apply(null,buckets.map(function(b){return b.v}))),bw=iw/buckets.length;
    var g='';for(var k=0;k<=4;k++){var y=T+ih-ih*k/4;g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(236,230,214,.12)"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end">$'+Math.round(mx*k/4)+'</text>'}
    var every=Math.ceil(buckets.length/8);
    buckets.forEach(function(b,i){
      var h=ih*b.v/mx,x=L+i*bw+bw*.15,lab=new Date(b.t).toLocaleDateString([],{month:'short',day:'numeric'});
      g+='<rect x="'+x+'" y="'+(T+ih-h)+'" width="'+(bw*.7)+'" height="'+Math.max(h,b.v?2:0)+'" fill="#c9982a"><title>'+(step>1?'Week of ':'')+lab+': '+H.money2(b.v)+' from '+b.n+' order'+(b.n===1?'':'s')+'</title></rect>';
      if(i%every===0)g+='<text x="'+(x+bw*.35)+'" y="'+(Ht-8)+'" text-anchor="middle">'+lab+'</text>';
    });
    return '<svg class="chart" viewBox="0 0 '+W+' '+Ht+'" role="img" aria-label="Revenue by '+(step>1?'week':'day')+'. Total '+H.money2(buckets.reduce(function(a,b){return a+b.v},0))+'.">'+g+'</svg>';
  }
  function hbars(rows,fmt){
    var mx=Math.max.apply(null,rows.map(function(r){return r.v}).concat([1]));
    return rows.length?'<div class="hb">'+rows.map(function(r){return '<div class="hbr"><span class="hl">'+esc(r.l)+'</span><span class="hv">'+fmt(r.v)+(r.s?'<small> · '+esc(r.s)+'</small>':'')+'</span><i style="width:'+Math.max(2,r.v/mx*100)+'%"></i></div>'}).join('')+'</div>':'<p class="fine">Nothing yet.</p>';
  }
  var SAMPLE_NAMES=['Jordan Reyes','Sam Whitaker','Casey Ng','Riley Boone','Morgan Tate','Alex Duarte','Jamie Cole','Taylor Pruitt','Drew Calloway','Quinn Harlan'];
  function addSample(){
    var ps=H.products({all:true}).filter(function(p){return p.published!==false});if(!ps.length){toast('Add a product first',true);return}
    var os=H.orders(),n=os.reduce(function(m,o){return Math.max(m,parseInt(String(o.number).replace(/\D/g,''),10)||1000)},1000),out=[],s=H.settings();
    for(var i=0;i<45;i++){
      var items=[],k=1+Math.floor(Math.random()*2);
      for(var j=0;j<k;j++){var p=ps[Math.floor(Math.random()*ps.length)],q=1+Math.floor(Math.random()*(Math.random()<.2?3:1));
        items.push({id:p.id,name:p.name,opt:p.options&&p.options.length?p.options[Math.floor(Math.random()*p.options.length)]:'',qty:q,price:p.price,image:p.images&&p.images[0]||''})}
      var sub=items.reduce(function(a,x){return a+x.price*x.qty},0),pick=Math.random()<.35,ship=pick?0:(s.freeOver>0&&sub>=s.freeOver?0:s.shipFlat),tax=Math.round(sub*s.taxRate)/100,nm=SAMPLE_NAMES[Math.floor(Math.random()*SAMPLE_NAMES.length)];
      var when=Date.now()-Math.pow(Math.random(),1.3)*45*DAY-Math.random()*DAY*.5;
      out.push({number:'HG-'+(++n),date:new Date(when).toISOString(),status:Math.random()<.06?'cancelled':when<Date.now()-5*DAY?'fulfilled':'new',method:pick?'pickup':'ship',
        customer:{name:nm,email:nm.split(' ')[0].toLowerCase()+'@example.com',phone:''},address:pick?null:{line1:'123 Sample St',city:'Brooksville',state:'FL',zip:'34601'},
        note:'',items:items,sub:sub,ship:ship,tax:tax,total:sub+ship+tax,demo:true,sample:true});
    }
    H.saveOrders(out.concat(os).sort(function(a,b){return new Date(b.date)-new Date(a.date)}));toast('Added 45 sample orders');renderReports();renderOrderBadge();
  }
  function renderReports(){
    var days=+$('#range').value,all=H.orders(),now=Date.now(),cut=days?dayStart(now)-(days-1)*DAY:0;
    var live=all.filter(function(o){return o.status!=='cancelled'});
    var cur=live.filter(function(o){return new Date(o.date)>=cut}),prev=days?live.filter(function(o){var t=+new Date(o.date);return t<cut&&t>=cut-days*DAY}):[];
    var hasSample=all.some(function(o){return o.sample}),body=$('#repbody');
    if(!all.length){body.innerHTML='<div class="empty"><img src="img/wolf.png" alt=""><p>No orders yet, so there is nothing to report. Place a demo order on the storefront, or load sample orders to see how the reports look.</p><button class="btn" id="loadsample" type="button">Load sample orders</button></div>';return}
    var c=sums(cur),p=sums(prev),prod={},cat={coffee:0,merch:0},plist=H.products({all:true}),cats={};
    plist.forEach(function(x){cats[x.id]=x.category});
    cur.forEach(function(o){o.items.forEach(function(i){var r=prod[i.id]||(prod[i.id]={name:i.name,units:0,rev:0});r.units+=i.qty;r.rev+=i.qty*i.price;var cg=cats[i.id]||'merch';cat[cg]=(cat[cg]||0)+i.qty*i.price})});
    var top=Object.keys(prod).map(function(k){return prod[k]}).sort(function(a,b){return b.rev-a.rev});
    var st={};all.filter(function(o){return !days||new Date(o.date)>=cut}).forEach(function(o){st[o.status]=(st[o.status]||0)+1});
    var cust={};cur.forEach(function(o){var k=(o.customer.email||'').toLowerCase();cust[k]=(cust[k]||0)+1});
    var ck=Object.keys(cust),repeat=ck.filter(function(k){return cust[k]>1}).length;
    function tile(l,v,d){return '<div class="stat"><b>'+v+'</b><span>'+l+'</span>'+(days&&d?'<em class="'+(d.charAt(0)==='▼'?'dn':'up')+'">'+d+' vs prior</em>':'')+'</div>'}
    var inv=plist.map(function(x){return {p:x,sold:(prod[x.id]||{units:0}).units}}).sort(function(a,b){return a.p.stock-b.p.stock});
    body.innerHTML=(hasSample?'<div class="notice">This includes <b>sample orders</b> for demonstration. <button class="btn ghost mini" id="rmsample" type="button">Remove sample orders</button></div>':'')+
      '<div class="stats">'+tile('Revenue',H.money2(c.rev),pct(c.rev,p.rev))+tile('Orders',c.n,pct(c.n,p.n))+tile('Avg order',H.money2(c.aov),pct(c.aov,p.aov))+tile('Units sold',c.units,pct(c.units,p.units))+tile('Pickup orders',c.n?Math.round(c.pick/c.n*100)+'%':'0%','')+tile('Repeat customers',repeat+' of '+ck.length,'')+'</div>'+
      '<div class="rep-card"><h3>Revenue '+(days?'':'(all time)')+'</h3>'+(cur.length?chart(cur,days):'<p class="fine">No orders in this range.</p>')+'<p class="fine">Cancelled orders are not counted.</p></div>'+
      '<div class="rep-grid"><div class="rep-card"><h3>Top products by revenue</h3>'+hbars(top.slice(0,6).map(function(t){return {l:t.name,v:t.rev,s:t.units+' sold'}}),H.money2)+'</div>'+
      '<div class="rep-card"><h3>Sales by category</h3>'+hbars([{l:'Coffee',v:cat.coffee||0},{l:'Merch',v:cat.merch||0}],H.money2)+
      '<h3 style="margin-top:22px">Orders by status</h3>'+hbars(['new','packed','fulfilled','cancelled'].filter(function(k){return st[k]}).map(function(k){return {l:k.charAt(0).toUpperCase()+k.slice(1),v:st[k]}}),function(v){return v})+'</div></div>'+
      '<div class="rep-card"><h3>Inventory</h3><div class="tbl"><table><thead><tr><th>Product</th><th>In stock</th><th>Sold in range</th><th>Price</th><th>Stock value</th><th></th></tr></thead><tbody>'+
      inv.map(function(r){var x=r.p,flag=x.stock<=0?'<span class="pill bad">Sold out</span>':x.stock<=5?'<span class="pill warn">Low</span>':(r.sold&&x.stock<r.sold/2?'<span class="pill warn">Selling fast</span>':'');
        return '<tr><td>'+esc(x.name)+(x.published===false?' <small>(hidden)</small>':'')+'</td><td>'+x.stock+'</td><td>'+r.sold+'</td><td>'+H.money2(x.price)+'</td><td>'+H.money2(x.stock*x.price)+'</td><td>'+flag+'</td></tr>'}).join('')+
      '</tbody><tfoot><tr><td>Total</td><td>'+inv.reduce(function(a,r){return a+r.p.stock},0)+'</td><td>'+c.units+'</td><td></td><td>'+H.money2(inv.reduce(function(a,r){return a+r.p.stock*r.p.price},0))+'</td><td></td></tr></tfoot></table></div></div>';
  }
  $('#range').addEventListener('change',renderReports);
  $('#repbody').addEventListener('click',function(e){
    if(e.target.id==='loadsample')addSample();
    if(e.target.id==='rmsample'){H.saveOrders(H.orders().filter(function(o){return !o.sample}));toast('Sample orders removed');renderReports();renderOrderBadge()}
  });
  $('#repcsv').addEventListener('click',function(){
    var days=+$('#range').value,cut=days?dayStart(Date.now())-(days-1)*DAY:0,m={};
    H.orders().filter(function(o){return o.status!=='cancelled'&&new Date(o.date)>=cut}).forEach(function(o){o.items.forEach(function(i){var r=m[i.id]||(m[i.id]={name:i.name,units:0,rev:0});r.units+=i.qty;r.rev+=i.qty*i.price})});
    var rows=[['Product','Units sold','Revenue']].concat(Object.keys(m).map(function(k){return [m[k].name,m[k].units,m[k].rev.toFixed(2)]}));
    if(rows.length<2){toast('No sales in this range',true);return}
    download('haggard-product-sales.csv','text/csv',rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"'}).join(',')}).join('\n'));
  });

  /* ---------- settings ---------- */
  function renderSettings(){
    var s=H.settings(),f=$('#setform').elements;
    f.shipFlat.value=s.shipFlat;f.freeOver.value=s.freeOver;f.taxRate.value=s.taxRate;f.pickup.checked=s.pickup;f.pickupNote.value=s.pickupNote;
  }
  $('#setform').addEventListener('submit',function(e){
    e.preventDefault();var f=e.target.elements,s=H.settings();
    s.shipFlat=Math.max(0,parseFloat(f.shipFlat.value)||0);s.freeOver=Math.max(0,parseFloat(f.freeOver.value)||0);s.taxRate=Math.max(0,parseFloat(f.taxRate.value)||0);
    s.pickup=f.pickup.checked;s.pickupNote=f.pickupNote.value.trim();saved(H.saveSettings(s));
  });
  $('#pwform').addEventListener('submit',function(e){
    e.preventDefault();var f=e.target.elements;
    if(f.np.value!==f.np2.value){toast('Passwords do not match',true);return}
    H.hash(f.np.value).then(function(h){H.setPw(h);e.target.reset();toast('Password updated')});
  });

  /* ---------- data ---------- */
  function download(name,type,text){
    var a=d.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:type}));a.href=u;a.download=name;d.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},500);
  }
  function renderData(){
    var kb=H.storageKB(),pct=Math.min(100,kb/5000*100);
    $('#usage').textContent='Browser storage used: '+(kb>1024?(kb/1024).toFixed(1)+' MB':kb+' KB')+' of about 5 MB';
    $('#usagebar').style.width=pct+'%';
  }
  $('#export').addEventListener('click',function(){download('haggard-backup-'+new Date().toISOString().slice(0,10)+'.json','application/json',H.exportAll());$('#datamsg').textContent='Backup downloaded.'});
  $('#import').addEventListener('change',function(e){
    var fl=e.target.files[0];if(!fl)return;var r=new FileReader();
    r.onload=function(){try{H.importAll(r.result);$('#datamsg').textContent='Backup restored.';renderProducts();renderData();toast('Restored')}catch(err){$('#datamsg').textContent='That file is not a Haggard backup.'}};
    r.readAsText(fl);e.target.value='';
  });
  $('#reset').addEventListener('click',function(){
    if(confirm('Reset all products to the original four? Your added products and photos will be removed. Orders are kept.')){H.resetCatalog();renderProducts();renderData();$('#datamsg').textContent='Catalog reset.'}
  });
})();
