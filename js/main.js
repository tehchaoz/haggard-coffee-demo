(function(){
  var d=document,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr=d.querySelector('.site-header'),burger=d.querySelector('.burger');
  function onScroll(){
    hdr.classList.toggle('solid',scrollY>40);
    if(reduce)return;
    var y=scrollY;
    d.querySelectorAll('[data-par]').forEach(function(el){
      var r=el.parentElement.getBoundingClientRect();
      if(r.bottom<-200||r.top>innerHeight+200)return;
      el.style.transform='translate3d(0,'+((r.top+r.height/2-innerHeight/2)*parseFloat(el.dataset.par))+'px,0)';
    });
    d.querySelectorAll('[data-float]').forEach(function(el){
      var r=el.getBoundingClientRect();
      var k=(r.top+r.height/2-innerHeight/2)*parseFloat(el.dataset.float);
      el.style.transform='translate3d(0,'+k+'px,0) rotate('+(el.dataset.rot||0)+'deg)';
    });
  }
  addEventListener('scroll',function(){requestAnimationFrame(onScroll)},{passive:true});onScroll();

  burger&&burger.addEventListener('click',function(){
    var o=d.body.classList.toggle('nav-open');burger.setAttribute('aria-expanded',o);
  });
  d.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click',function(){d.body.classList.remove('nav-open');burger&&burger.setAttribute('aria-expanded','false')})});

  var rvs=[].slice.call(d.querySelectorAll('.rv'));
  function reveal(){
    rvs=rvs.filter(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<innerHeight*.92&&r.bottom>0){el.classList.add('in');return false}
      return true;
    });
  }
  addEventListener('scroll',reveal,{passive:true});addEventListener('resize',reveal);addEventListener('load',reveal);
  reveal();setTimeout(reveal,150);setTimeout(reveal,700);

  // tilt cards
  if(!reduce&&matchMedia('(hover:hover)').matches){
    d.querySelectorAll('.card').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        c.style.transform='perspective(800px) rotateY('+x*6+'deg) rotateX('+(-y*6)+'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave',function(){c.style.transform=''});
    });
  }


  // splash intro (once per session)
  var sp=d.getElementById('splash');
  if(sp){
    var seen=false;try{seen=sessionStorage.getItem('hg-splash')}catch(e){}
    function endSplash(){sp.classList.add('gone');d.body.style.overflow=''}
    if(seen||reduce){endSplash()}
    else{try{sessionStorage.setItem('hg-splash','1')}catch(e){}
      d.body.style.overflow='hidden';sp.addEventListener('click',endSplash);setTimeout(endSplash,3400)}
  }

  // wolf spotlight follows pointer (auto-orbits on touch / idle)
  var st=d.getElementById('wolfstage');
  if(st){
    function setM(x,y){st.style.setProperty('--mx',x+'%');st.style.setProperty('--my',y+'%')}
    var last=0;
    st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect();last=Date.now();setM((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100)});
    if(!reduce){(function orbit(t){if(Date.now()-last>1500)setM(50+22*Math.cos(t/900),46+18*Math.sin(t/700));requestAnimationFrame(orbit)})(0)}
  }

  // open now (Brooksville, FL)
  var H={0:[8,16],1:[7,15],2:[7,15],3:[8,16],4:[8,16],5:[8,16],6:[8,16]};
  function fmt(h){var s=h>=12?'PM':'AM';return ((h+11)%12+1)+' '+s}
  var parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  var map={};parts.forEach(function(p){map[p.type]=p.value});
  var dow={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[map.weekday],t=(+map.hour%24)+(+map.minute)/60;
  var h=H[dow],open=t>=h[0]&&t<h[1];
  d.querySelectorAll('.open-badge').forEach(function(b){
    b.classList.toggle('is-open',open);
    b.querySelector('.txt').textContent=open?'Open now · until '+fmt(h[1]):'Closed · '+(t<h[0]?'opens today ':'opens tomorrow ')+(t<h[0]?fmt(h[0]):fmt(H[(dow+1)%7][0]));
  });
  d.querySelectorAll('.hours li[data-d]').forEach(function(li){
    if(+li.dataset.d.split(',').indexOf(String(dow))>-1||li.dataset.d.split(',').indexOf(String(dow))>-1)li.classList.add('today');
  });

  // Forms post to Formspree (or any Formspree-compatible endpoint).
  // Paste each form's URL here, e.g. 'https://formspree.io/f/abcdwxyz'. See README.md.
  var ENDPOINTS={contact:'',wholesale:'',notify:''};
  d.querySelectorAll('form[data-form]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var m=f.querySelector('.form-msg');
      if(!m){m=d.createElement('p');m.className='form-msg';m.setAttribute('role','status');f.appendChild(m)}
      var url=ENDPOINTS[f.dataset.form],btn=f.querySelector('button[type=submit]');
      if(!url){m.textContent='This form is not connected to email yet. Please use Instagram in the meantime.';return}
      if(f.querySelector('[name=_gotcha]').value)return;
      btn.disabled=true;m.textContent='Sending…';
      fetch(url,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}})
        .then(function(r){if(!r.ok)throw 0;m.textContent=f.dataset.ok;f.reset()})
        .catch(function(){m.textContent='Something went wrong. Please try again or message us on Instagram.'})
        .then(function(){btn.disabled=false});
    });
  });
})();
