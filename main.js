/* ========== CONFIG (modificar segun necesidad) ========== */
    const CONFIG = {
      whatsapp: '+5491123456789', // poner sin espacios ni guiones. Ej: +54911xxxxxxx
      oldSiteUrl: 'https://tu-antigua-tienda.example',
      // Mercado Pago: para pagar con Mercado Pago, necesitás un endpoint en tu servidor que cree la preferencia
      mercadoPago: {
        enabled: false, // poner true si ya tenés un endpoint funcionando
        createPreferenceUrl: '/create_preference', // endpoint que crea la preferencia y devuelve {id, init_point}
        publicKey: 'YOUR_MERCADO_PAGO_PUBLIC_KEY'
      }
    }

    /* ========== DATOS (agregar / editar productos) ========== */
    const products = [
      {id:1,title:'Smart TV RCA 40"',price:279990,img:'assets/img/tvrcta40.jpeg',stock:5},
      {id:2,title:'Lavarropas MIIDEA gris 6KG 1000rpm',price:159990,img:'assets/img/lavarropamiidea.jpeg',stock:3},
      {id:3,title:'Heladera No Frost',price:219990,img:'https://via.placeholder.com/300x200?text=Heladera',stock:2},
      {id:4,title:'Microondas 25L',price:34990,img:'https://via.placeholder.com/300x200?text=Microondas',stock:7},
      {id:5,title:'Aspiradora Ciclonica',price:42990,img:'https://via.placeholder.com/300x200?text=Aspiradora',stock:4}
    ];

    /* ========== LÓGICA DEL CARRITO ========== */
    const $grid = document.getElementById('products-grid');
    const $cartPanel = document.getElementById('cart-panel');
    const $cartItems = document.getElementById('cart-items');
    const $cartTotal = document.getElementById('cart-total');
    const $cartCount = document.getElementById('cart-count');
    const $miniCount = document.getElementById('mini-count');
    const $openCartBtn = document.getElementById('open-cart');
    const $toggle = document.getElementById('cart-toggle');
    const $goShop = document.getElementById('go-shop');
    const $linkOld = document.getElementById('link-old');
    const $sendWhats = document.getElementById('send-whatsapp');
    const $payMP = document.getElementById('pay-mercadopago');

    let cart = JSON.parse(localStorage.getItem('cart_v1')||'[]');

    function formatMoney(n){ return '$' + n.toLocaleString('es-AR'); }

    function renderProducts(){
      $grid.innerHTML = '';
      products.forEach(p=>{
        const card = document.createElement('div'); card.className='card';
        card.innerHTML = `
          <img src="${p.img}" alt="${p.title}">
          <h3>${p.title}</h3>
          <div style="color:var(--muted);font-size:13px">Stock: ${p.stock}</div>
          <div class="price">${formatMoney(p.price)}</div>
          <div class="actions">
            <button class="btn btn-primary add" data-id="${p.id}">Agregar</button>
            <button class="btn btn-ghost view" data-id="${p.id}">Ver</button>
          </div>
        `;
        $grid.appendChild(card);
      });
    }

    function saveCart(){ localStorage.setItem('cart_v1', JSON.stringify(cart)); updateCartUI(); }

    function updateCartUI(){
      $cartItems.innerHTML='';
      if(cart.length===0){ $cartItems.innerHTML='<div style="color:var(--muted)">Tu carrito está vacío.</div>'; }
      let total=0, count=0;
      cart.forEach(item=>{
        const prod = products.find(p=>p.id===item.id);
        total += prod.price * item.qty; count += item.qty;
        const div = document.createElement('div'); div.className='cart-item';
        div.innerHTML = `
          <img src="${prod.img}" alt="${prod.title}">
          <div style="flex:1">
            <div style="font-weight:700">${prod.title}</div>
            <div style="color:var(--muted);font-size:13px">${item.qty} x ${formatMoney(prod.price)}</div>
            <div style="margin-top:8px;display:flex;gap:6px">
              <button class="btn btn-ghost minus" data-id="${item.id}">-</button>
              <button class="btn btn-ghost plus" data-id="${item.id}">+</button>
              <button class="btn btn-ghost remove" data-id="${item.id}">Quitar</button>
            </div>
          </div>
        `;
        $cartItems.appendChild(div);
      });
      $cartTotal.textContent = formatMoney(total);
      $cartCount.textContent = count;
      $miniCount.textContent = count>0?count:'';
    }

    function addToCart(id){
      const prod = products.find(p=>p.id===id);
      const cur = cart.find(c=>c.id===id);
      if(!cur){ cart.push({id,qty:1}); }
      else if(cur.qty < prod.stock) { cur.qty +=1; }
      else { alert('No hay más stock disponible'); }
      saveCart();
    }

    function changeQty(id,delta){
      const idx = cart.findIndex(c=>c.id===id); if(idx===-1) return;
      cart[idx].qty += delta; if(cart[idx].qty<=0) cart.splice(idx,1);
      saveCart();
    }

    document.body.addEventListener('click', e=>{
      if(e.target.matches('.add')) addToCart(Number(e.target.dataset.id));
      if(e.target.matches('.view')){
        const p = products.find(x=>x.id==e.target.dataset.id);
        alert(p.title + '\n' + formatMoney(p.price));
      }
      if(e.target.matches('.minus')) changeQty(Number(e.target.dataset.id), -1);
      if(e.target.matches('.plus')) changeQty(Number(e.target.dataset.id), +1);
      if(e.target.matches('.remove')){
        cart = cart.filter(c=>c.id !== Number(e.target.dataset.id)); saveCart();
      }
    });

    // toggles
    $openCartBtn.addEventListener('click', ()=>{ toggleCart(); });
    $toggle.addEventListener('click', ()=>{ toggleCart(); });
    $goShop.addEventListener('click', ()=>{ location.href = '#shop'; });
    $linkOld.addEventListener('click', (e)=>{ e.preventDefault(); window.location.href = CONFIG.oldSiteUrl; });

    function toggleCart(){
      if($cartPanel.classList.contains('hidden')){
        $cartPanel.classList.remove('hidden'); $cartPanel.setAttribute('aria-hidden','false');
      } else { $cartPanel.classList.add('hidden'); $cartPanel.setAttribute('aria-hidden','true'); }
    }

    // preparar mensaje whatsapp
    function buildWhatsAppMessage(){
      if(cart.length===0) return '';
      let lines = ['*Nuevo pedido desde tienda web*',''];
      let total = 0;
      cart.forEach(it=>{
        const p = products.find(x=>x.id===it.id);
        lines.push(`${it.qty} x ${p.title} — ${formatMoney(p.price*it.qty)}`);
        total += p.price * it.qty;
      });
      lines.push('');
      lines.push(`*Total: ${formatMoney(total)}*`);
      lines.push('');
      lines.push('Datos del cliente:\nNombre: \nDirección: \nTeléfono:');
      return encodeURIComponent(lines.join('\n'));
    }

    function sendWhatsApp(){
      const msg = buildWhatsAppMessage(); if(!msg){ alert('El carrito está vacío'); return; }
      const phone = CONFIG.whatsapp.replace(/\D/g,'');
      const url = `https://wa.me/${phone}?text=${msg}`;
      window.open(url,'_blank');
    }

    $sendWhats.addEventListener('click', (e)=>{ e.preventDefault(); sendWhatsApp(); });

    // Mercado Pago (ejemplo cliente -> hace fetch al endpoint que crea preference)
    $payMP.addEventListener('click', async ()=>{
      if(!CONFIG.mercadoPago.enabled){ alert('MercadoPago no está habilitado. Para activarlo, configurá CONFIG.mercadoPago.enabled = true y montá el endpoint que cree la preferencia.'); return; }
      // Armar items para la preferencia
      const items = cart.map(it=>{
        const p = products.find(x=>x.id===it.id);
        return { title:p.title, quantity: it.qty, unit_price: p.price }
      });
      try{
        const res = await fetch(CONFIG.mercadoPago.createPreferenceUrl, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({items})
        });
        if(!res.ok) throw new Error('Error creando preferencia');
        const data = await res.json();
        // data should contain init_point or id depending en tu implementación
        if(data.init_point) window.location.href = data.init_point; else alert('Respuesta invalida del servidor MercadoPago');
      }catch(err){ alert('Error con MercadoPago: '+err.message); }
    });

    // inicializar
    renderProducts(); updateCartUI();

    // Exponer link viejo
    document.getElementById('link-old').href = CONFIG.oldSiteUrl;

    // Si querés vaciar el carrito con una tecla (dev)
    window.clearCart = ()=>{ cart=[]; saveCart(); };