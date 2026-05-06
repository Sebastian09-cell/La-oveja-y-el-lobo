// 1. ESTADO DEL CARRITO Y CONFIGURACIÓN
let carrito = {};
let productoTemporal = {}; 
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtro = btn.textContent.trim().toUpperCase();

        menuCards.forEach(card => {
            const categoria = card.getAttribute('data-category').toUpperCase();
            const visible = filtro === 'TODO' || categoria === filtro;

            if (visible) {
                card.style.display = 'block';
                setTimeout(() => card.style.opacity = '1', 10);
            } else {
                card.style.opacity = '0';
                setTimeout(() => card.style.display = 'none', 500);
            }
        });
    });
});

const opcionesPorCategoria = {
    "BURGERS": {
        mensaje: "¡Hazlo combo! Elige una gaseosa (+ $8.000):",
        limite: 1,
        items: ["Coca-Cola", "Manzana Postobón", "Pepsi", "Agua Manantial"],
        extras: [
            { nombre: "Tocineta Extra", precio: 4000 },
            { nombre: "Queso Extra", precio: 3000 },
            { nombre: "Cebolla Grillé", precio: 2000 }
        ]
    },
    "ENTRADAS": {
        mensaje: "Elige tu salsa:",
        limite: 1,
        items: ["BBQ", "Miel Mostaza", "Salsa de la Casa"],
        extras: []
    }
};

const normalizar = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

document.addEventListener('click', (e) => {
    const btnPlus = e.target.closest('.plus');
    const btnMinus = e.target.closest('.minus');

    if (btnPlus) {
        e.preventDefault(); 
        const name = btnPlus.getAttribute('data-name');
        const price = parseInt(btnPlus.getAttribute('data-price'));
        const card = btnPlus.closest('.menu-card');
        const category = card ? card.getAttribute('data-category').toUpperCase() : "";

        if (opcionesPorCategoria[category]) {
            abrirPersonalizacion(name, price, category);
        } else {
            sumarAlCarrito(name, price);
        }
    }
    
    if (btnMinus) {
        const name = btnMinus.getAttribute('data-name');
        const nameNorm = normalizar(name);
        const claveCarrito = Object.keys(carrito).find(key => 
            normalizar(key).startsWith(nameNorm)
        );

        if (claveCarrito) {
            if (carrito[claveCarrito].qty > 0) {
                carrito[claveCarrito].qty--;
                if (carrito[claveCarrito].qty === 0) delete carrito[claveCarrito];
                actualizarInterfaz();
            }
        }
    }
});


function abrirPersonalizacion(nombre, precio, categoria) {
    productoTemporal = { nombre, precio, categoria };
    const config = opcionesPorCategoria[categoria];
    
    document.getElementById('nombre-producto-modal').innerText = nombre;
    
    // Renderizar Opciones (Gaseosas/Acompañantes)
    const contOpciones = document.getElementById('contenedor-opciones-dinamicas');
    contOpciones.innerHTML = `<p class="modal-instruction"><strong>${config.mensaje}</strong></p>`;

    config.items.forEach(opcion => {
        contOpciones.innerHTML += `
            <label class="opcion-item">
                <input type="checkbox" name="acompanante" value="${opcion}" 
                       onchange="gestionarSeleccion(${config.limite}, '${categoria}')">
                <span>${opcion}</span>
            </label>`;
    });

    // Renderizar Extras
    const contExtras = document.getElementById('contenedor-extras-dinamicos');
    contExtras.innerHTML = config.extras.length > 0 ? `<p class="modal-instruction"><strong>¿Deseas agregar algo más?</strong></p>` : "";

    config.extras.forEach(extra => {
        contExtras.innerHTML += `
            <label class="opcion-item">
                <input type="checkbox" class="extra-item" 
                       data-price="${extra.precio}" 
                       data-name="${extra.nombre}" 
                       onchange="calcularTotalModal()">
                <span>${extra.nombre} (+$${extra.precio.toLocaleString('es-CO')})</span>
            </label>`;
    });

    document.getElementById('modal-personalizar').style.display = 'flex';
    calcularTotalModal();
    gestionarSeleccion(config.limite, categoria);
}

function gestionarSeleccion(limite, categoria) {
    const seleccionados = document.querySelectorAll('input[name="acompanante"]:checked');
    const todos = document.querySelectorAll('input[name="acompanante"]');
    const btn = document.getElementById('btn-confirmar-plato');

    todos.forEach(input => {
        if (!input.checked) input.disabled = (seleccionados.length >= limite);
    });

    if (categoria === "BURGERS") {
        btn.disabled = false;
        btn.innerText = seleccionados.length > 0 ? "AGREGAR COMBO" : "AGREGAR SOLO HAMBURGUESA";
    } else {
        btn.disabled = seleccionados.length < limite;
        btn.innerText = btn.disabled ? `FALTAN ${limite - seleccionados.length} OPCIONES` : "CONFIRMAR";
    }
    calcularTotalModal();
}

function calcularTotalModal() {
    let extraTotal = 0;
    
    const tieneCombo = document.querySelectorAll('input[name="acompanante"]:checked').length > 0;
    if (productoTemporal.categoria === "BURGERS" && tieneCombo) {
        extraTotal += 8000;
    }

    document.querySelectorAll('.extra-item:checked').forEach(ex => {
        extraTotal += parseInt(ex.getAttribute('data-price'));
    });

    const total = productoTemporal.precio + extraTotal;
    document.getElementById('precio-final-modal').innerText = `$${total.toLocaleString('es-CO')}`;
    return total;
}

function finalizarPersonalizacion() {
    const precioFinal = calcularTotalModal();
    const acompanantes = Array.from(document.querySelectorAll('input[name="acompanante"]:checked')).map(el => el.value);
    const extras = Array.from(document.querySelectorAll('.extra-item:checked')).map(el => el.getAttribute('data-name'));

    let nombreDetallado = productoTemporal.nombre;
    if (acompanantes.length > 0) nombreDetallado += ` (COMBO: ${acompanantes.join(", ")})`;
    if (extras.length > 0) nombreDetallado += ` + ${extras.join(", ")}`;

    sumarAlCarrito(nombreDetallado, precioFinal);
    cerrarModal();
}

function cerrarModal() {
    document.getElementById('modal-personalizar').style.display = 'none';
}

function sumarAlCarrito(nombreCompleto, precio) {
    if (!carrito[nombreCompleto]) {
        carrito[nombreCompleto] = { qty: 0, price: precio };
    }
    carrito[nombreCompleto].qty++;
    actualizarInterfaz();
}

function actualizarInterfaz() {
    let totalPrecio = 0; //pone el precio en 0
    let totalItems = 0;// vacia el carrito 

    document.querySelectorAll('.qty-number').forEach(span => span.textContent = '0');//pone el span  revisa si son correctos nose la vvd

    for (const producto in carrito) {
        const item = carrito[producto]; // pone la variable item como la entrada al carrito
        
        const nombreBase = producto.split(' (')[0].trim(); 
        
        const idBusqueda = `qty-${nombreBase.replace(/\s+/g, '-').toUpperCase()}`;// no entiendo
        
        const contadorVisual = document.getElementById(idBusqueda);
        
        if (contadorVisual) { 
            const valorActual = parseInt(contadorVisual.textContent);
            contadorVisual.textContent = valorActual + item.qty;
        }

        totalPrecio += item.qty * item.price;
        totalItems += item.qty;
    }

    const btnCheckout = document.getElementById('cart-checkout');
    if (btnCheckout) {
        btnCheckout.style.display = totalItems > 0 ? 'flex' : 'none';
        document.getElementById('cart-total').textContent = `$${totalPrecio.toLocaleString('es-CO')}`;
    }
}

// 5. ENVÍO WHATSAPP
function prepararEnvio() {
    const selectorSede = document.getElementById('sede-selector');
    const telefonoSede = selectorSede.value; 
    const nombreSede = selectorSede.options[selectorSede.selectedIndex].text;

    if (Object.keys(carrito).length === 0){  // si el carrito esta vacio
        alert("El carrito está vacío");
        return;
    }

    let mensaje = `*PEDIDO LA OVEJA Y EL LOBO* 🐺\n`;
    mensaje += `📍 *${nombreSede}*\n`;
    mensaje += `--------------------------\n\n`; 
    
    let total = 0;

    for (const p in carrito) { // recorre el carrito
        const subtotal = carrito[p].qty * carrito[p].price;
        mensaje += `✅ ${carrito[p].qty}x ${p}\n`;
        mensaje += `Subtotal: $${subtotal.toLocaleString('es-CO')}\n\n`;
        total += subtotal;
    }

    mensaje += `--------------------------\n`;
    mensaje += `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*`;

    const url = `https://wa.me/${telefonoSede}?text=${encodeURIComponent(mensaje)}`; 
    window.open(url, '_blank');
}