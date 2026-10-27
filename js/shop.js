/* Storefront: product grids, product page, cart drawer, demo checkout. Needs store.js. */
(function(){
  var H=window.HG,d=document,esc=H.esc;
  function $(s,r){return (r||d).querySelector(s)}
  function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
  function img(p,i){return (p.images&&p.images[i||0])||''}
  function pimg(p,i,alt){
    var s=img(p,i);
    return s?'<img src="'+esc(s)+'" alt="'+esc(alt||p.name)+'" loading="lazy">':'<img class="ph" src="img/wolf.png" alt="" loading="lazy">';
  }
  function tag(p){
    if(!H.inStock(p))return '<span class="tag">Sold out</span>';
    if(p.badge)return '<span class="tag">'+esc(p.badge)+'</span>';
    if(p.stock<=5)return '<span class="tag">Only '+p.stock+' left</span>';
    return '';
  }
  function price(p){return '<span class="price">'+H.money(p.price)+'</span>'+(p.compareAt>p.price?' <s class="was">'+H.money(p.compareAt)+'</s>':'')}
  function href(p){return 'product.html?id='+encodeURIComponent(p.id)}

  /* ---------- grids ---------- */
  function card(p,i){
    var hasOpt=p.options&&p.options.length,act;
    if(!H.inStock(p))act='<a class="btn ghost mini" href="'+href(p)+'#notify">Notify me</a>';
    else if(hasOpt)act='<a class="btn ghost mini" href="'+href(p)+'">Choose '+esc((p.optionLabel||'option').toLowerCase())+'</a>';
    else act='<button class="btn mini" type="button" data-add="'+esc(p.id)+'">Add to cart</button>';
    return '<article class="card rv'+(i?' d'+Math.min(i,3):'')+'">'+tag(p)+
      '<a class="card-media" href="'+href(p)+'" aria-label="'+esc(p.name)+'"><figure>'+pimg(p)+'</figure></a>'+
      '<div class="card-body"><p class="meta">'+esc(p.meta||(p.category==='coffee'?'Coffee':'Merch'))+'</p>'+
      '<h3><a href="'+href(p)+'">'+esc(p.name)+'</a></h3>'+
      (p.desc?'<p>'+esc(p.desc.length>110?p.desc.slice(0,107)+'…':p.desc)+'</p>':'')+
      '<div class="card-foot"><p class="priceline">'+price(p)+'</p>'+act+'</div></div></article>';
  }
  function renderGrids(){
    $$('[data-shop]').forEach(function(el){
      var kind=el.dataset.shop,list;
      if(kind==='featured'){
        list=H.products();var f=list.filter(function(p){return p.featured});
        list=(f.length?f:list).slice(0,3);
      }else list=H.products({category:kind});
      el.innerHTML=list.length?list.map(card).join(''):
        '<div class="empty"><img src="img/wolf.png" alt="" width="90"><p>Nothing here yet. Check back soon, or holler at us on Instagram.</p></div>';
    });
  }

  /* ---------- cart drawer ---------- */
  var bag='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  function mountCart(){
    var wrap=$('.site-header .wrap');
    if(wrap&&!$('.cart-btn')){
      var b=d.createElement('button');b.className='cart-btn';b.type='button';b.setAttribute('aria-label','Open cart');
      b.innerHTML=bag+'<span class="cart-count" aria-hidden="true">0</span>';
      var burger=$('.burger',wrap);wrap.insertBefore(b,burger?burger.nextSibling:null);
      b.addEventListener('click',openCart);
    }
    if(!$('#cart')){
      var ov=d.createElement('div');ov.className='drawer-ov';ov.id='cartov';
      var a=d.createElement('aside');a.className='drawer';a.id='cart';a.setAttribute('aria-label','Shopping cart');a.setAttribute('role','dialog');
      a.innerHTML='<div class="drawer-head"><h2>Your cart</h2><button class="drawer-x" type="button" aria-label="Close cart">×</button></div><div class="drawer-body" id="cartbody"></div><div class="drawer-foot" id="cartfoot"></div>';
      d.body.appendChild(ov);d.body.appendChild(a);
      ov.addEventListener('click',closeCart);$('.drawer-x',a).addEventListener('click',closeCart);
      d.addEventListener('keydown',function(e){if(e.key==='Escape')closeCart()});
      a.addEventListener('click',function(e){
        var t=e.target.closest('[data-q]');if(!t)return;
        var id=t.dataset.id,opt=t.dataset.opt||'',cur=H.cart().filter(function(l){return l.id===id&&(l.opt||'')===opt})[0];
        if(!cur)return;
        H.setQty(id,opt,t.dataset.q==='rm'?0:cur.qty+(t.dataset.q==='+'?1:-1));
      });
    }
  }
  function openCart(){d.body.classList.add('cart-open');var x=$('.drawer-x');x&&x.focus()}
  function closeCart(){d.body.classList.remove('cart-open')}
  function renderCart(){
    var n=H.cartCount();
    $$('.cart-count').forEach(function(c){c.textContent=n;c.classList.toggle('on',n>0)});
    var body=$('#cartbody'),foot=$('#cartfoot');if(!body)return;
    var lines=H.cartLines(),s=H.settings();
    if(!lines.length){
      body.innerHTML='<div class="empty"><img src="img/wolf.png" alt="" width="80"><p>Your cart is empty.</p><a class="btn ghost mini" href="coffee.html">Shop coffee</a> <a class="btn ghost mini" href="merch.html">Shop merch</a></div>';
      foot.innerHTML='';return;
    }
    body.innerHTML=lines.map(function(l){
      var o=esc(l.opt);
      return '<div class="line"><a href="'+href(l.p)+'" class="thumb">'+pimg(l.p,0,'')+'</a><div class="info"><a href="'+href(l.p)+'" class="nm">'+esc(l.p.name)+'</a>'+
        (l.opt?'<span class="opt">'+esc(l.p.optionLabel||'Option')+': '+o+'</span>':'')+
        '<div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-" data-id="'+esc(l.p.id)+'" data-opt="'+o+'" aria-label="Decrease">−</button><span>'+l.qty+'</span><button type="button" data-q="+" data-id="'+esc(l.p.id)+'" data-opt="'+o+'" aria-label="Increase"'+(l.qty>=l.p.stock?' disabled':'')+'>+</button></div></div>'+
        '<div class="end"><span class="lp">'+H.money2(l.total)+'</span><button type="button" class="rm" data-q="rm" data-id="'+esc(l.p.id)+'" data-opt="'+o+'">Remove</button></div></div>';
    }).join('');
    var t=H.totals('ship'),pct=s.freeOver>0?Math.min(100,t.sub/s.freeOver*100):100;
    foot.innerHTML=(s.freeOver>0?'<div class="ship"><p>'+(t.toFree>0?'Add <b>'+H.money2(t.toFree)+'</b> more for free shipping':'<b>Free shipping</b> unlocked')+'</p><div class="bar"><i style="width:'+pct+'%"></i></div></div>':'')+
      '<div class="sub"><span>Subtotal</span><b>'+H.money2(t.sub)+'</b></div><p class="fine">Shipping and tax are calculated at checkout.</p>'+
      '<a class="btn block" href="checkout.html">Checkout</a><p class="fine demo">Demo store. No real payments are taken.</p>';
  }

  /* ---------- add to cart (delegated) ---------- */
  d.addEventListener('click',function(e){
    var t=e.target.closest('[data-add]');if(!t)return;
    if(H.addToCart(t.dataset.add,'',1)){renderCart();openCart()}
  });

  /* ---------- product page ---------- */
  function renderProduct(){
    var root=$('#product-root');if(!root)return;
    var id=new URLSearchParams(location.search).get('id'),p=id&&H.product(id);
    if(!p||p.published===false){root.innerHTML='<div class="empty"><img src="img/wolf.png" alt="" width="90"><p>We could not find that product.</p><a class="btn" href="coffee.html">Back to the shop</a></div>';return}
    d.title=p.name+' | Haggard Coffee Roasters & Oddities';
    var imgs=p.images&&p.images.length?p.images:[''],ins=H.inStock(p);
    var opts=p.options&&p.options.length?'<label class="fld">'+esc(p.optionLabel||'Option')+'<select id="popt">'+p.options.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select></label>':'';
    root.innerHTML='<div class="pd">'+
      '<div class="pd-gal"><figure class="pd-main" id="pmain">'+(imgs[0]?'<img src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'">':'<img class="ph" src="img/wolf.png" alt="">')+'</figure>'+
      (imgs.length>1?'<div class="pd-thumbs">'+imgs.map(function(s,i){return '<button type="button" class="'+(i?'':'on')+'" data-i="'+i+'" aria-label="Photo '+(i+1)+'"><img src="'+esc(s)+'" alt=""></button>'}).join('')+'</div>':'')+'</div>'+
      '<div class="pd-info"><nav class="crumbs"><a href="index.html">Home</a> / <a href="'+(p.category==='coffee'?'coffee':'merch')+'.html">'+(p.category==='coffee'?'Coffee':'Merch')+'</a></nav>'+
      '<p class="eyebrow">'+esc(p.meta||'')+'</p><h1>'+esc(p.name)+'</h1><p class="priceline big">'+price(p)+'</p>'+
      '<p class="pd-desc">'+esc(p.desc).replace(/\n/g,'<br>')+'</p>'+
      (ins?'<form id="addform" class="addform">'+opts+'<div class="fld">Quantity<div class="qty big"><button type="button" data-s="-" aria-label="Decrease">−</button><input id="pqty" type="number" min="1" max="'+p.stock+'" value="1" aria-label="Quantity"><button type="button" data-s="+" aria-label="Increase">+</button></div></div>'+
        '<button class="btn block" type="submit">Add to cart</button><p class="fine">'+(p.stock<=5?'Only '+p.stock+' left. ':'')+'Free shipping over '+H.money(H.settings().freeOver)+'.</p></form>'
      :'<div id="notify" class="soldout"><span class="tag static">Sold out</span><p>Want to know when it is back? Leave your email.</p><form class="notify" data-form="notify" data-ok="Got it. We will holler when it is back.">'+
        '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><input type="hidden" name="_subject" value="Restock alert: '+esc(p.name)+'"><input type="hidden" name="product" value="'+esc(p.name)+'">'+
        '<label class="sr" for="nemail" style="position:absolute;left:-999px">Email</label><input id="nemail" type="email" name="email" required placeholder="you@email.com" autocomplete="email"><button class="btn mini" type="submit">Notify me</button></form></div>')+
      '</div></div>';
    var main=$('#pmain img');
    $$('.pd-thumbs button').forEach(function(b){b.addEventListener('click',function(){
      main.src=imgs[+b.dataset.i];$$('.pd-thumbs button').forEach(function(x){x.classList.toggle('on',x===b)})})});
    var q=$('#pqty');
    $$('[data-s]').forEach(function(b){b.addEventListener('click',function(){
      q.value=Math.max(1,Math.min(p.stock,(+q.value||1)+(b.dataset.s==='+'?1:-1)))})});
    var f=$('#addform');
    f&&f.addEventListener('submit',function(e){
      e.preventDefault();
      var o=$('#popt')?$('#popt').value:'',n=Math.max(1,Math.min(p.stock,+q.value||1));
      if(H.addToCart(p.id,o,n)){renderCart();openCart()}
      else{var m=$('.fine',f);m.textContent='You already have the most we have in stock in your cart.'}
    });
    // related
    var rel=$('#related');
    if(rel){var l=H.products().filter(function(x){return x.id!==p.id&&x.category===p.category}).slice(0,3);
      rel.innerHTML=l.length?'<div class="wrap"><div class="sec-head"><p class="eyebrow">More like this</p><h2>Keep browsing</h2></div><div class="cards">'+l.map(card).join('')+'</div></div>':''}
  }

  /* ---------- checkout ---------- */
  function renderCheckout(){
    var root=$('#checkout-root');if(!root)return;
    var s=H.settings(),lines=H.cartLines();
    if(!lines.length){root.innerHTML='<div class="empty"><img src="img/wolf.png" alt="" width="90"><p>Your cart is empty.</p><a class="btn" href="coffee.html">Shop coffee</a> <a class="btn ghost" href="merch.html">Shop merch</a></div>';return}
    root.innerHTML='<div class="demo-banner"><b>Demo checkout.</b> No real payment is taken and nothing will ship. Use test card <code>4242 4242 4242 4242</code>, any future date, any 3 digits.</div>'+
    '<div class="co"><form id="coform" class="co-form" novalidate>'+
      '<section><h2>Contact</h2><div class="two"><label class="fld">Email<input type="email" name="email" required autocomplete="email"></label><label class="fld">Phone <small>(optional)</small><input type="tel" name="phone" autocomplete="tel"></label></div></section>'+
      '<section><h2>Delivery</h2><div class="choice">'+
        '<label><input type="radio" name="method" value="ship" checked><span><b>Ship it</b><small>'+(s.freeOver>0?H.money(s.shipFlat)+' flat, free over '+H.money(s.freeOver):H.money(s.shipFlat)+' flat')+'</small></span></label>'+
        (s.pickup?'<label><input type="radio" name="method" value="pickup"><span><b>Pick up in Brooksville</b><small>Free · '+esc(s.pickupNote)+'</small></span></label>':'')+'</div>'+
        '<div id="shipfields"><div class="two"><label class="fld">First name<input name="first" required autocomplete="given-name"></label><label class="fld">Last name<input name="last" required autocomplete="family-name"></label></div>'+
        '<label class="fld">Address<input name="addr" required autocomplete="address-line1"></label>'+
        '<div class="three"><label class="fld">City<input name="city" required autocomplete="address-level2"></label><label class="fld">State<input name="state" required maxlength="2" value="FL" autocomplete="address-level1" style="text-transform:uppercase"></label><label class="fld">ZIP<input name="zip" required inputmode="numeric" maxlength="10" autocomplete="postal-code"></label></div></div>'+
        '<div id="pickfields" hidden><label class="fld">Name for pickup<input name="pname" autocomplete="name"></label></div>'+
        '<label class="fld">Order note <small>(optional)</small><textarea name="note" rows="2"></textarea></label></section>'+
      '<section><h2>Payment <span class="lock">Demo only</span></h2>'+
        '<label class="fld">Card number<input name="cc" required inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="19"></label>'+
        '<div class="three"><label class="fld">Name on card<input name="ccname" required autocomplete="off"></label><label class="fld">Expiry<input name="exp" required inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="off"></label><label class="fld">CVC<input name="cvc" required inputmode="numeric" maxlength="4" autocomplete="off"></label></div>'+
        '<p class="fine">Card details are never stored or sent anywhere. Only the test card above works.</p></section>'+
      '<p class="form-msg err" id="comsg" role="alert"></p>'+
      '<button class="btn block" type="submit" id="paybtn">Place demo order</button></form>'+
    '<aside class="co-sum" id="cosum"></aside></div>';
    var form=$('#coform');
    function method(){return form.elements['method'].value}
    function sum(){
      var t=H.totals(method());
      $('#cosum').innerHTML='<h2>Order summary</h2>'+lines.map(function(l){
        return '<div class="sl"><div class="thumb">'+pimg(l.p,0,'')+'<i>'+l.qty+'</i></div><div class="nm">'+esc(l.p.name)+(l.opt?'<small>'+esc(l.opt)+'</small>':'')+'</div><b>'+H.money2(l.total)+'</b></div>'}).join('')+
        '<dl><dt>Subtotal</dt><dd>'+H.money2(t.sub)+'</dd><dt>'+(method()==='pickup'?'Pickup':'Shipping')+'</dt><dd>'+(t.ship?H.money2(t.ship):'Free')+'</dd><dt>Estimated tax ('+s.taxRate+'%)</dt><dd>'+H.money2(t.tax)+'</dd></dl>'+
        '<div class="tot"><span>Total</span><b>'+H.money2(t.total)+'</b></div><a class="fine" href="coffee.html">Edit cart</a>';
    }
    function toggle(){
      var pick=method()==='pickup';
      $('#shipfields').hidden=pick;$('#pickfields').hidden=!pick;
      $$('#shipfields [name]').forEach(function(i){i.required=!pick&&i.name!=='note'});
      $('[name=pname]').required=pick;sum();
    }
    $$('[name=method]',form).forEach(function(r){r.addEventListener('change',toggle)});toggle();
    $('[name=cc]').addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()});
    $('[name=exp]').addEventListener('input',function(){var v=this.value.replace(/\D/g,'').slice(0,4);this.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v});
    $('[name=cvc]').addEventListener('input',function(){this.value=this.value.replace(/\D/g,'')});
    form.addEventListener('submit',function(e){
      e.preventDefault();var msg=$('#comsg');msg.textContent='';
      if(!form.checkValidity()){form.reportValidity();return}
      var cc=form.cc.value.replace(/\s/g,''),exp=form.exp.value.match(/^(\d\d)\/(\d\d)$/);
      if(cc!=='4242424242424242'){
        msg.textContent=cc==='4000000000000002'?'Your card was declined (demo test card). Try 4242 4242 4242 4242.':'This is a demo store. Please use the test card 4242 4242 4242 4242.';return}
      var now=new Date(),yy=exp&&+exp[2]+2000,mm=exp&&+exp[1];
      if(!exp||mm<1||mm>12||yy*12+mm<now.getFullYear()*12+now.getMonth()+1){msg.textContent='Enter a future expiry date, like 12/34.';return}
      // stock re-check
      var bad=H.cartLines().filter(function(l){return l.qty>l.p.stock});
      if(bad.length){msg.textContent=bad[0].p.name+' just sold out or is low on stock. Please update your cart.';return}
      var btn=$('#paybtn');btn.disabled=true;btn.textContent='Processing…';
      var pick=method()==='pickup',f=form;
      setTimeout(function(){
        var order=H.placeOrder({method:method(),note:f.note.value,
          customer:{email:f.email.value,phone:f.phone.value,name:pick?f.pname.value:(f.first.value+' '+f.last.value).trim()},
          address:pick?null:{line1:f.addr.value,city:f.city.value,state:f.state.value.toUpperCase(),zip:f.zip.value}});
        renderCart();showConfirm(order);
      },1100);
    });
  }
  function showConfirm(o){
    var root=$('#checkout-root');scrollTo({top:0,behavior:'smooth'});
    root.innerHTML='<div class="confirm"><img src="img/wolf.png" alt="" width="90"><p class="eyebrow">Demo order placed</p><h2>Thanks, '+esc(o.customer.name.split(' ')[0]||'friend')+'!</h2>'+
      '<p>Order <b>'+esc(o.number)+'</b> · A receipt would go to '+esc(o.customer.email)+'.</p>'+
      '<div class="receipt">'+o.items.map(function(i){return '<div class="sl"><div class="nm">'+esc(i.name)+(i.opt?'<small>'+esc(i.opt)+'</small>':'')+' × '+i.qty+'</div><b>'+H.money2(i.price*i.qty)+'</b></div>'}).join('')+
      '<dl><dt>Subtotal</dt><dd>'+H.money2(o.sub)+'</dd><dt>'+(o.method==='pickup'?'Pickup':'Shipping')+'</dt><dd>'+(o.ship?H.money2(o.ship):'Free')+'</dd><dt>Tax</dt><dd>'+H.money2(o.tax)+'</dd></dl><div class="tot"><span>Total</span><b>'+H.money2(o.total)+'</b></div></div>'+
      '<p class="fine">'+(o.method==='pickup'?'Pickup at 635 W Fort Dade Ave, Brooksville.':'Ships to '+esc(o.address.line1)+', '+esc(o.address.city)+', '+esc(o.address.state)+' '+esc(o.address.zip)+'.')+' This was a demo. No payment was taken and nothing will ship.</p>'+
      '<div class="hero-cta" style="justify-content:center"><a class="btn" href="index.html">Back home</a><button class="btn ghost" type="button" onclick="print()">Print receipt</button></div></div>';
  }

  /* ---------- boot ---------- */
  mountCart();renderGrids();renderProduct();renderCheckout();renderCart();
  ['cart','products','settings'].forEach(function(n){d.addEventListener('hg:'+n,renderCart)});
  addEventListener('storage',function(){renderCart();renderGrids()});
  if(location.hash==='#cart')openCart();
})();
