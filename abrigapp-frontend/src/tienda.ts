declare global {
    interface Window {
        contactWhatsapp: (title: string, price: number) => void;
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
                <div class="col-md-10">
                    <h1 class="fw-bold mb-2">${storeData.name}</h1>
                    <p class="text-muted mb-2"><i class="ri-map-pin-line"></i> ${storeData.city}</p>
                    <p class="mb-0 fs-5">${storeData.description || '¡Apoyando la economía local!'}</p>
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
                <img src="${p.imageUrl || 'https://via.placeholder.com/300x200'}" class="product-img" alt="${p.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold">${p.title}</h5>
                    <p class="card-text text-muted small flex-grow-1">${(p.description || '').substring(0, 100)}${(p.description && p.description.length > 100) ? '...' : ''}</p>
                    <h6 class="text-success fw-bold fs-5 mb-3">$ ${p.price}</h6>
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

    let text = `¡Hola *${storeData.name}*! 👋\nEstoy interesado(a) en este producto de tu catálogo en AbrigApp:\n\n*${title}* por $${price}\n\nQuedo atento(a) para más información. ¡Gracias!`;
    const encodedText = encodeURIComponent(text);
    
    // Remove all non-numeric chars from whatsapp string
    let phone = storeData.whatsappNumber.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '57' + phone; // Default to Colombia code if 10 digits
    
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
};

loadStore();
