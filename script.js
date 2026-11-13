const WHATSAPP = "573218301624";
const MAX_SALSAS = 2; // cuántas salsas puede elegir el cliente por plato
// El domicilio (entre $4.000 y $6.000) se cuadra por WhatsApp: no se suma al total.
// Sin costo de empaque.

function toggleMenu(titulo) {
  const seccion = titulo.nextElementSibling;
  if (!seccion) return;
  seccion.style.display = seccion.style.display === "block" ? "none" : "block";
}
function toggleCantidad(checkbox) {
  const item = checkbox.closest(".item");
  if (!item) return;
  const cantidad = item.querySelector(".cantidad");
  if (!cantidad) return;
  if (checkbox.checked) {
    cantidad.disabled = false;
    if (Number(cantidad.value) === 0) cantidad.value = 1;
  } else {
    cantidad.value = 0;
    cantidad.disabled = true;
  }
  calcularTotal();
}
function toggleDescripcion(checkbox) {
  const item = checkbox.closest(".item");
  if (!item) return;
  const desc = item.querySelector(".descripcion");
  if (!desc) return;
  desc.style.display = checkbox.checked ? "block" : "none";
}
function cambiarCantidad(btn, delta) {
  const input = btn.parentElement.querySelector(".cantidad");
  if (!input || input.disabled) return;
  const nuevo = Math.max(0, (Number(input.value) || 0) + delta);
  if (nuevo === 0) {
    // Al llegar a 0 se desmarca el plato
    const cb = input.closest(".item").querySelector(".check-plato");
    cb.checked = false;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  input.value = nuevo;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
function calcularTotal() {
  let subtotal = 0;
  let contadorEmpaque = 0;
  document.querySelectorAll(".check-plato").forEach(cb => {
    if (!cb.checked) return;
    const item = cb.closest(".item");
    if (!item) return;
    const cantidad = Number(item.querySelector(".cantidad")?.value) || 0;
    if (cantidad <= 0) return;
    const sel = item.querySelector(".tamano");
    const precio = sel ? Number(sel.value) : Number(item.querySelector(".item-linea span")?.dataset.precio);
    subtotal += (precio || 0) * cantidad;
    contadorEmpaque += cantidad;
  });
  const tipoEntrega = document.getElementById("tipoEntrega")?.value;
  // [SI EL RESTAURANTE COBRA DOMICILIO: descomentar]
  // if (tipoEntrega === "A domicilio") subtotal += COSTO_DOMICILIO;
  // [SI EL RESTAURANTE COBRA EMPAQUE: descomentar]
  // let empaque = (tipoEntrega === "Comer dentro del local") ? 0 : contadorEmpaque * 1500;
  // subtotal += empaque;
  document.getElementById("total").innerText = "$" + subtotal.toLocaleString("es-CO");
  document.getElementById("totalPedido").value = subtotal;
}

const $ = id => document.getElementById(id);

// Especificaciones y salsas por unidad de cada plato
// Las salsas escritas en el HTML sirven de plantilla: se clonan por cada unidad pedida
document.querySelectorAll(".item").forEach(item => {
  const plantilla = item.querySelector(".salsas");
  item._salsas = "";
  if (plantilla) {
    plantilla.style.display = "";
    plantilla.querySelector(".maxs").textContent = MAX_SALSAS;
    item._salsas = plantilla.outerHTML;
    plantilla.remove();
  }
  const cont = document.createElement("div");
  cont.className = "unidades";
  cont.style.display = "none";
  item.appendChild(cont);
});
function actualizarUnidades(item) {
  const cb = item.querySelector(".check-plato");
  const n = cb.checked ? (Number(item.querySelector(".cantidad").value) || 0) : 0;
  const cont = item.querySelector(".unidades");
  while (cont.children.length > n) cont.lastElementChild.remove();
  while (cont.children.length < n) {
    const k = cont.children.length + 1;
    const u = document.createElement("div");
    u.className = "unidad";
    u.innerHTML = '<div class="u-tit">' + cb.value + " #" + k + "</div>" + item._salsas +
      '<input type="text" class="nota" placeholder="Especificaciones (ej: sin cebolla)" maxlength="120">';
    cont.appendChild(u);
  }
  cont.classList.toggle("multi", n > 1);
  cont.style.display = n > 0 ? "block" : "none";
}
document.addEventListener("change", function (e) {
  const t = e.target;
  if (t.classList.contains("check-plato") || t.classList.contains("cantidad")) {
    actualizarUnidades(t.closest(".item"));
  } else if (t.classList.contains("salsa-op")) {
    const marcadas = t.closest(".salsas").querySelectorAll(".salsa-op:checked");
    if (marcadas.length > MAX_SALSAS) { t.checked = false; alert("Puedes elegir máximo " + MAX_SALSAS + " salsas 🥫"); }
  }
});
document.addEventListener("input", function (e) {
  if (e.target.classList.contains("cantidad")) actualizarUnidades(e.target.closest(".item"));
});

// Copiar número de cuenta
function copiarNumero(btn) {
  const numero = btn.previousElementSibling.textContent.trim();
  const listo = () => {
    btn.textContent = "✅ Copiado";
    btn.classList.add("ok");
    setTimeout(() => { btn.textContent = "📋 Copiar"; btn.classList.remove("ok"); }, 2000);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(numero).then(listo).catch(() => copiarRespaldo(numero, listo));
  } else {
    copiarRespaldo(numero, listo);
  }
}
function copiarRespaldo(texto, listo) {
  const t = document.createElement("textarea");
  t.value = texto;
  t.style.position = "fixed";
  t.style.opacity = "0";
  document.body.appendChild(t);
  t.select();
  try { document.execCommand("copy"); listo(); } catch (e) {}
  document.body.removeChild(t);
}

// Tipo de entrega
$("tipoEntrega").addEventListener("change", function () {
  const v = this.value;
  const dom = v === "A domicilio";
  $("direccionField").style.display = dom ? "block" : "none";
  $("costoDomicilio").style.display = dom ? "block" : "none";
  $("direccion").required = dom;
  $("mesaField").style.display = v === "Comer dentro del local" ? "block" : "none";
  calcularTotal();
});

// Tipo de pago
$("tipoPago").addEventListener("change", function () {
  const v = this.value;
  const transf = v === "Nequi" || v === "Bancolombia";
  $("efectivoField").style.display = v === "Efectivo" ? "block" : "none";
  $("infoPago").style.display = transf ? "block" : "none";
  $("infoNequi").style.display = v === "Nequi" ? "block" : "none";
  $("infoBanco").style.display = v === "Bancolombia" ? "block" : "none";
});

// Envío del pedido
$("pedidoForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const platos = [];
  document.querySelectorAll(".check-plato").forEach(cb => {
    if (!cb.checked) return;
    const item = cb.closest(".item");
    const cant = Number(item.querySelector(".cantidad")?.value) || 0;
    if (cant <= 0) return;
    let base = cb.value;
    const sab = item.querySelector(".sabor");
    const tam = item.querySelector(".tamano");
    if (sab) base += " (" + sab.value + ")";
    if (tam) base += " (" + tam.options[tam.selectedIndex].text + ")";
    // Agrupa las unidades iguales: las que llevan especificaciones van aparte de las simples
    const grupos = new Map();
    item.querySelectorAll(".unidad").forEach(u => {
      const sal = [...u.querySelectorAll(".salsa-op:checked")].map(o => o.value);
      const nota = u.querySelector(".nota").value.trim();
      let extra = "";
      if (sal.length) extra += "\n\u2003\u2003• Salsas: " + sal.join(", ");
      if (nota) extra += "\n\u2003\u2003• Nota: " + nota;
      grupos.set(extra, (grupos.get(extra) || 0) + 1);
    });
    grupos.forEach((n, extra) => platos.push("• " + n + " x " + base + extra));
  });
  if (platos.length === 0) { alert("Selecciona al menos un plato 🍔"); return; }

  const btn = this.querySelector(".btn");
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, 5000);

  const entrega = $("tipoEntrega").value;
  const pago = $("tipoPago").value;
  const m = [];
  m.push("🍔 *Nuevo pedido*");
  m.push("");
  m.push("👤 Nombre: " + $("nombre").value);
  m.push("📞 Teléfono: " + $("telefono").value);
  m.push("");
  m.push("*Pedido:*");
  m.push(...platos);
  m.push("");
  m.push("📦 Entrega: " + entrega);
  if (entrega === "A domicilio") {
    m.push("📍 Dirección: " + $("direccion").value);
    m.push("🛵 Domicilio ($4.000 a $6.000 según barrio): se cuadra por WhatsApp");
  }
  if (entrega === "Comer dentro del local") m.push("🔢 Mesa: " + $("numeroMesa").value);
  m.push("💰 Pago: " + pago);
  if (pago === "Efectivo" && $("efectivoCliente").value) m.push("💵 Paga con: " + $("efectivoCliente").value);
  if ($("especificaciones").value.trim()) m.push("📒 Especificaciones: " + $("especificaciones").value.trim());
  m.push("");
  m.push("💸 *Total: " + $("total").innerText + "*" + (entrega === "A domicilio" ? " (sin domicilio)" : ""));

  // Guardar en Google Sheets (vía Google Forms)
  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSffU1UhAqmZEwEskgJKNHqSiaN6doP-WsPOgIJjCdp5bRVyiQ/formResponse";
  const datos = new FormData();
  datos.append("entry.1943373341", $("nombre").value);
  datos.append("entry.783371005", $("telefono").value);
  datos.append("entry.799856903", platos.join(" | ").replace(/\s*\n\s*/g, " "));
  datos.append("entry.1322723003", entrega);
  datos.append("entry.2104689249", entrega === "A domicilio" ? $("direccion").value : (entrega === "Comer dentro del local" ? "Mesa " + $("numeroMesa").value : ""));
  datos.append("entry.2021986845", pago);
  datos.append("entry.29496371", $("efectivoCliente").value);
  datos.append("entry.1981734591", $("especificaciones").value.trim());
  datos.append("entry.1286544164", $("totalPedido").value);
  fetch(FORM_URL, { method: "POST", mode: "no-cors", body: datos, keepalive: true }).catch(() => {});

  // Pequeña pausa para que el envío a Sheets salga antes de abrir WhatsApp
  setTimeout(() => {
    window.location.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(m.join("\n"));
  }, 400);
});