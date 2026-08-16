declare global {
    interface Window {
        contactWhatsapp: (title: string, price: number) => void;
        showReportModal: (type: string, id: string) => void;
        shareBusiness: (name: string, slug: string) => void;
        submitReport: (e: Event) => void;
    }
}

const urlParams = new URLSearchParams(window.location.search);
const storeSlug = urlParams.get('slug');

if (!storeSlug) {
    window.location.href = '/';
}

let storeData: any = null;

const loadStore = async () => {
    try {
        const res = await fetch(`/api/public/store/${storeSlug}`);
        if (!res.ok) {
            document.getElementById('storeHeader')!.innerHTML = `
                <div class="container text-center py-5">
                    <h2 class="text-danger">Tienda no encontrada</h2>
                    <a href="/" class="btn btn-outline-primary mt-3">Volver al inicio</a>
                </div>
            `;
            return;
        }

        storeData = await res.json();
        renderHeader();
        renderProducts();
    } catch (e) {
        console.error(e);
    }
};

const renderHeader = () => {
    const header = document.getElementById('storeHeader')!;
    const logo = storeData.logoUrl || `https://ui-avatars.com/api/?name=${storeData.name.replace(' ', '+')}&size=120`;
    
    header.innerHTML = `
        <div class="container">
            <div class="row align-items-center text-center text-md-start">
                <div class="col-md-2 mb-3 mb-md-0">
                    <img src="${logo}" alt="${storeData.name}" class="rounded-circle" style="width: 120px; height: 120px; object-fit: cover; border: 4px solid var(--primary-color);">
                </div>
                <div class="col-md-9">
                    <h1 class="fw-bold mb-2">${storeData.name}</h1>
                    <p class="text-muted mb-2"><i class="ri-map-pin-line"></i> ${storeData.city}</p>
                    <p class="mb-0 fs-5">${storeData.description || '¡Apoyando la economía local!'}</p>
                </div>
                <div class="col-md-2 text-md-end mt-3 mt-md-0 d-flex flex-row flex-md-column justify-content-center gap-2 align-items-md-end">
                    <button class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2" onclick="shareBusiness('${storeData.name}', '${storeData.slug}')" title="Compartir tienda">
                        <i class="ri-share-forward-line fs-5"></i> <span class="d-md-none">Compartir</span>
                    </button>
                    <button class="btn btn-outline-danger border-0 d-flex align-items-center justify-content-center gap-2" onclick="showReportModal('business', '${storeData.id}')" title="Reportar tienda">
                        <i class="ri-flag-line fs-5"></i> <span class="d-md-none">Reportar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
};

const renderProducts = () => {
    const grid = document.getElementById('productsGrid')!;
    if (!storeData.products || storeData.products.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5">Esta tienda aún no tiene productos disponibles.</div>`;
        return;
    }

    grid.innerHTML = storeData.products.map((p: any) => `
        <div class="col-12 col-md-4 col-lg-3">
            <div class="card product-card">
                <img src="${p.imageUrl || '/default-product.png'}" class="product-img" alt="${p.title}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title fw-bold pe-2">${p.title}</h5>
                        <button class="btn btn-sm btn-link text-danger p-0 border-0" onclick="showReportModal('product', '${p.id}')" title="Reportar producto"><i class="ri-flag-line"></i></button>
                    </div>
                    <p class="card-text text-muted small flex-grow-1">${(p.description || '').substring(0, 100)}${(p.description && p.description.length > 100) ? '...' : ''}</p>
                    <h6 class="text-success fw-bold fs-5 mb-3">$ ${Number(p.price).toLocaleString('es-CO')}</h6>
                    <button class="btn btn-success w-100 mt-auto rounded-pill" onclick="contactWhatsapp('${p.title.replace(/'/g, "\\'")}', ${p.price})">
                        <i class="ri-whatsapp-line"></i> Me interesa
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

window.contactWhatsapp = (title: string, price: number) => {
    if (!storeData || !storeData.whatsappNumber) return;

    let text = `¡Hola *${storeData.name}*! 👋\nEstoy interesado(a) en este producto de tu catálogo en AbrigApp:\n\n*${title}* por $${Number(price).toLocaleString('es-CO')}\n\nQuedo atento(a) para más información. ¡Gracias!`;
    const encodedText = encodeURIComponent(text);
    
    // Remove all non-numeric chars from whatsapp string
    let phone = storeData.whatsappNumber.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '57' + phone; // Default to Colombia code if 10 digits
    
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
};

window.shareBusiness = async (name: string, slug: string) => {
    const url = `${window.location.origin}/tienda.html?slug=${slug}`;
    if (navigator.share) {
        try {
            await navigator.share({
                title: `${name} en AbrigApp`,
                text: `¡Conoce a ${name} y apoya el comercio local en AbrigApp!`,
                url: url
            });
        } catch (err) {
            console.log('Share canceled or failed');
        }
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('¡Enlace copiado al portapapeles! Ya puedes pegarlo en tus redes o WhatsApp.');
        });
    }
};

window.showReportModal = (type: string, id: string) => {
    (document.getElementById('reportType') as HTMLInputElement).value = type;
    (document.getElementById('reportId') as HTMLInputElement).value = id;
    (document.getElementById('reportReason') as HTMLTextAreaElement).value = '';
    const alertEl = document.getElementById('reportAlert')!;
    alertEl.style.display = 'none';
    
    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
};

window.submitReport = async (e: Event) => {
    e.preventDefault();
    const btn = document.getElementById('reportSubmitBtn') as HTMLButtonElement;
    const type = (document.getElementById('reportType') as HTMLInputElement).value;
    const id = (document.getElementById('reportId') as HTMLInputElement).value;
    const reason = (document.getElementById('reportReason') as HTMLTextAreaElement).value;
    const alertEl = document.getElementById('reportAlert')!;

    if (!reason.trim()) {
        alertEl.className = 'alert alert-danger mt-3';
        alertEl.textContent = 'Por favor ingresa una razón.';
        alertEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const res = await fetch('/api/public/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, targetId: id, reason })
        });

        if (res.ok) {
            alertEl.className = 'alert alert-success mt-3';
            alertEl.textContent = 'Reporte enviado correctamente. Gracias por ayudarnos.';
            alertEl.style.display = 'block';
            setTimeout(() => {
                // @ts-ignore
                bootstrap.Modal.getInstance(document.getElementById('reportModal'))?.hide();
            }, 2000);
        } else {
            throw new Error();
        }
    } catch (err) {
        alertEl.className = 'alert alert-danger mt-3';
        alertEl.textContent = 'Error al enviar el reporte. Intenta más tarde.';
        alertEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Reporte';
    }
};

loadStore();
