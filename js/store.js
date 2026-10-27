/* Haggard shop data layer (demo).
   Everything lives in this browser's localStorage, so edits made in the admin
   are only visible on the same browser until a real backend is connected.
   Use Admin > Data > Export to back up or move the catalog. */
(function(){
  var KEY={products:'hg.products',settings:'hg.settings',orders:'hg.orders',cart:'hg.cart',auth:'hg.pw'};

  var SEED_PRODUCTS=[
    {id:'ethiopian-yirgacheffe',name:'Ethiopian Yirgacheffe',category:'coffee',price:20,compareAt:0,
     desc:'Grade 2 single origin from Ethiopia. Bright, floral and tea-like, roasted small in Brooksville.',
     images:['img/yirg.jpg'],stock:25,featured:true,published:true,badge:'',
     optionLabel:'Grind',options:['Whole bean','Drip','Espresso','French press'],meta:'12 oz bag'},
    {id:'guatemala-jalapa',name:'Guatemala Jalapa',category:'coffee',price:20,compareAt:0,
     desc:'Single origin from the Jalapa highlands. Rich, balanced and made for the morning ride.',
     images:['img/bags-three.jpg','img/bag-beans.jpg'],stock:25,featured:true,published:true,badge:'',
     optionLabel:'Grind',options:['Whole bean','Drip','Espresso','French press'],meta:'12 oz bag'},
    {id:'haggard-roasters-tee',name:'Haggard Roasters Tee',category:'merch',price:25,compareAt:0,
     desc:'Bone tee with the Haggard Coffee Roasters back print. Soft, boxy and built for the garage.',
     images:['img/merch-roasters.jpg','img/tee-moto.jpg'],stock:30,featured:false,published:true,badge:'',
     optionLabel:'Size',options:['S','M','L','XL','2XL'],meta:'Unisex tee'},
    {id:'death-before-decaf',name:'Death Before Decaf',category:'merch',price:25,compareAt:0,
     desc:'Black tee with the reaper on the back. The house motto, worn loud.',
     images:['img/merch-decaf.jpg','img/merch-reaper.jpg'],stock:30,featured:true,published:true,badge:'Fan favorite',
     optionLabel:'Size',options:['S','M','L','XL','2XL'],meta:'Unisex tee'}
  ];
  var SEED_SETTINGS={storeName:'Haggard Coffee Roasters & Oddities',shipFlat:6,freeOver:50,taxRate:6.5,pickup:true,
    pickupNote:'Pick up at 635 W Fort Dade Ave, Brooksville. Ready in about 20 minutes.'};

  function read(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
  var lastErr=null;
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));lastErr=null;return true}catch(e){lastErr=e;return false}}
  function emit(n){document.dispatchEvent(new CustomEvent('hg:'+n))}
  function clone(o){return JSON.parse(JSON.stringify(o))}
  function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'}
  var money=function(n){return '$'+(Math.round(n*100)/100).toFixed(2).replace(/\.00$/,'')};
  var money2=function(n){return '$'+(Math.round(n*100)/100).toFixed(2)};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  var HG=window.HG={money:money,money2:money2,esc:esc,slug:slug,
    lastError:function(){return lastErr},

    /* ---- settings ---- */
    settings:function(){return Object.assign({},SEED_SETTINGS,read(KEY.settings,{}))},
    saveSettings:function(s){var ok=write(KEY.settings,s);emit('settings');return ok},

    /* ---- products ---- */
    products:function(opts){
      var list=read(KEY.products,null);if(!list)list=clone(SEED_PRODUCTS);
      opts=opts||{};
      if(!opts.all)list=list.filter(function(p){return p.published!==false});
      if(opts.category)list=list.filter(function(p){return p.category===opts.category});
      return list;
    },
    product:function(id){return HG.products({all:true}).filter(function(p){return p.id===id})[0]},
    saveProducts:function(list){var ok=write(KEY.products,list);emit('products');return ok},
    saveProduct:function(p){
      var list=HG.products({all:true}),i=list.findIndex(function(x){return x.id===p.id});
      if(i<0){var base=slug(p.name),id=base,n=2;while(list.some(function(x){return x.id===id}))id=base+'-'+n++;p.id=id;list.push(p)}else list[i]=p;
      return HG.saveProducts(list)?p:null;
    },
    deleteProduct:function(id){return HG.saveProducts(HG.products({all:true}).filter(function(p){return p.id!==id}))},
    inStock:function(p){return (p.stock||0)>0},

    /* ---- cart ---- (line = {id, opt, qty}) */
    cart:function(){return read(KEY.cart,[])},
    cartLines:function(){
      return HG.cart().map(function(l){var p=HG.product(l.id);return p?{p:p,opt:l.opt||'',qty:l.qty,total:p.price*l.qty}:null}).filter(Boolean);
    },
    cartCount:function(){return HG.cart().reduce(function(a,l){return a+l.qty},0)},
    addToCart:function(id,opt,qty){
      var p=HG.product(id);if(!p||!HG.inStock(p))return false;
      var c=HG.cart(),l=c.filter(function(x){return x.id===id&&(x.opt||'')===(opt||'')})[0];
      var inCart=c.filter(function(x){return x.id===id}).reduce(function(a,x){return a+x.qty},0);
      qty=Math.max(1,qty||1);
      if(inCart+qty>p.stock)qty=Math.max(0,p.stock-inCart);
      if(!qty)return false;
      if(l)l.qty+=qty;else c.push({id:id,opt:opt||'',qty:qty});
      write(KEY.cart,c);emit('cart');return true;
    },
    setQty:function(id,opt,qty){
      var c=HG.cart(),p=HG.product(id);
      c=c.map(function(l){if(l.id===id&&(l.opt||'')===(opt||'')){l.qty=Math.min(qty,p?p.stock:qty)}return l}).filter(function(l){return l.qty>0});
      write(KEY.cart,c);emit('cart');
    },
    clearCart:function(){write(KEY.cart,[]);emit('cart')},
    totals:function(method){
      var s=HG.settings(),sub=HG.cartLines().reduce(function(a,l){return a+l.total},0);
      var ship=(method==='pickup'||!sub)?0:(sub>=s.freeOver&&s.freeOver>0?0:s.shipFlat);
      var tax=Math.round(sub*s.taxRate)/100;
      return {sub:sub,ship:ship,tax:tax,total:sub+ship+tax,toFree:Math.max(0,s.freeOver-sub)};
    },

    /* ---- orders ---- */
    orders:function(){return read(KEY.orders,[])},
    saveOrders:function(o){write(KEY.orders,o);emit('orders')},
    placeOrder:function(info){
      var lines=HG.cartLines();if(!lines.length)return null;
      var t=HG.totals(info.method),orders=HG.orders();
      var num='HG-'+(orders.reduce(function(m,o){return Math.max(m,parseInt(String(o.number).replace(/\D/g,''),10)||1000)},1000)+1);
      var order={number:num,date:new Date().toISOString(),status:'new',method:info.method,
        customer:info.customer,address:info.address,note:info.note||'',
        items:lines.map(function(l){return {id:l.p.id,name:l.p.name,opt:l.opt,qty:l.qty,price:l.p.price,image:l.p.images[0]||''}}),
        sub:t.sub,ship:t.ship,tax:t.tax,total:t.total,demo:true};
      orders.unshift(order);HG.saveOrders(orders);
      // decrement stock
      var list=HG.products({all:true});
      lines.forEach(function(l){var p=list.filter(function(x){return x.id===l.p.id})[0];if(p)p.stock=Math.max(0,(p.stock||0)-l.qty)});
      HG.saveProducts(list);HG.clearCart();
      return order;
    },

    /* ---- backup ---- */
    exportAll:function(){return JSON.stringify({version:1,exported:new Date().toISOString(),products:HG.products({all:true}),settings:HG.settings(),orders:HG.orders()},null,2)},
    importAll:function(txt){
      var d=JSON.parse(txt);if(!d||!Array.isArray(d.products))throw new Error('Not a Haggard export');
      write(KEY.products,d.products);if(d.settings)write(KEY.settings,d.settings);if(d.orders)write(KEY.orders,d.orders);
      emit('products');emit('settings');emit('orders');
    },
    resetCatalog:function(){try{localStorage.removeItem(KEY.products)}catch(e){}emit('products')},
    storageKB:function(){var n=0;try{for(var k in localStorage)if(k.indexOf('hg.')===0)n+=(localStorage[k].length*2)}catch(e){}return Math.round(n/1024)},

    /* ---- admin password (demo-grade, client side only) ---- */
    hash:function(s){
      if(!(window.crypto&&crypto.subtle))return Promise.resolve('p:'+btoa(unescape(encodeURIComponent(s))));
      return crypto.subtle.digest('SHA-256',new TextEncoder().encode('hg|'+s)).then(function(b){
        return [].slice.call(new Uint8Array(b)).map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')});
    },
    // Demo default password is 'Coldbrew' until the owner changes it in Settings.
    checkPw:function(pw){
      var stored=read(KEY.auth,null);
      return Promise.all([HG.hash(pw),stored?Promise.resolve(stored):HG.hash('Coldbrew')]).then(function(r){return r[0]===r[1]});
    },
    pwHash:function(){return read(KEY.auth,null)},
    setPw:function(h){write(KEY.auth,h)}
  };
})();
