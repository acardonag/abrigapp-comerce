const token = localStorage.getItem('abrigapp_token');
if (!token) {
    window.location.href = '/';
}

declare global {
    interface Window {
        logout: () => void;
        saveBusiness: (e: Event) => void;
        showProductModal: (product?: any) => void;
        saveProduct: (e: Event) => void;
        deleteProduct: (id: string) => void;
    }
}

window.logout = () => {
    localStorage.removeItem('abrigapp_token');
    window.location.href = '/';
};

const appContent = document.getElementById('appContent')!;
let categories: any[] = [];
let currentBusiness: any = null;
let products: any[] = [];

const fetchWithAuth = async (url: string, options: any = {}) => {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const res = await fetch(url, options);
    if (res.status === 401) {
        window.logout();
        throw new Error('Sesión expirada');
    }
    return res;
};

const initDashboard = async () => {
    try {
        // Load categories
        const catRes = await fetch('/api/public/categories');
        if (catRes.ok) categories = await catRes.json();

        // Check if user has a business profile
        const busRes = await fetchWithAuth('/api/business/my-business');
        if (busRes.ok) {
            const data = await busRes.json();
            if (data && Object.keys(data).length > 0) {
                currentBusiness = data;
                await loadProducts();
                renderDashboard();
            } else {
                renderSetupProfile();
            }
        } else if (busRes.status === 404) {
            renderSetupProfile();
        }
    } catch (e) {
        console.error(e);
        appContent.innerHTML = `<div class="alert alert-danger">Error cargando el panel. Revisa tu conexión.</div>`;
    }
};

const loadProducts = async () => {
    const res = await fetchWithAuth('/api/products');
    if (res.ok) products = await res.json();
};

const renderSetupProfile = () => {
    appContent.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card p-4 p-md-5">
                    <h3 class="fw-bold mb-3 text-center" style="color: var(--primary-color)">Registra tu Negocio</h3>
                    <p class="text-muted text-center mb-4">Completa la información de tu comercio para aparecer en el Directorio Solidario.</p>
                    
                    <form onsubmit="saveBusiness(event)">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-semibold">Nombre del Negocio *</label>
                                <input type="text" id="bName" class="form-control" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-semibold">URL amigable (Slug) *</label>
                                <input type="text" id="bSlug" class="form-control" placeholder="mi-negocio-armenia" required>
                                <div class="form-text">Ej: abrigapp.com/tienda/<strong>mi-negocio</strong></div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-semibold">Categoría *</label>
                                <select id="bCategory" class="form-select" required>
                                    <option value="">Selecciona...</option>
                                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-semibold">Ciudad *</label>
                                <select id="bCity" class="form-select" required>
                                    <option value="">Selecciona una ciudad...</option>
                                    <option value="Armenia">Armenia</option>
                                    <option value="Buenaventura">Buenaventura</option>
                                    <option value="Cali">Cali</option>
                                    <option value="Dosquebradas">Dosquebradas</option>
                                    <option value="Manizales">Manizales</option>
                                    <option value="Pereira">Pereira</option>
                                    <option value="Quibdó">Quibdó</option>
                                    <option value="Tuluá">Tuluá</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-semibold">Descripción del Negocio</label>
                            <textarea id="bDesc" class="form-control" rows="3"></textarea>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-semibold">Número de WhatsApp *</label>
                                <input type="text" id="bWhatsapp" class="form-control" placeholder="573001234567" required>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label fw-semibold">Logo del Negocio (Opcional)</label>
                                <input type="file" id="bLogoFile" class="form-control" accept="image/*">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary-custom w-100 py-2 fs-5 rounded-pill">Guardar y Continuar</button>
                    </form>
                </div>
            </div>
        </div>
    `;
};

window.saveBusiness = async (e: Event) => {
    e.preventDefault();
    const btn = e.target ? (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement : null;
    if (btn) btn.disabled = true;

    const fileInput = document.getElementById('bLogoFile') as HTMLInputElement;
    let logoUrl = currentBusiness ? currentBusiness.logoUrl : '';

    try {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (uploadRes.ok) {
                const upData = await uploadRes.json();
                logoUrl = upData.url;
            } else {
                throw new Error("Error subiendo el logo");
            }
        }

        const payload = {
            name: (document.getElementById('bName') as HTMLInputElement).value,
            slug: (document.getElementById('bSlug') as HTMLInputElement).value,
            categoryId: (document.getElementById('bCategory') as HTMLSelectElement).value,
            description: (document.getElementById('bDesc') as HTMLTextAreaElement).value,
            city: (document.getElementById('bCity') as HTMLSelectElement).value,
            whatsappNumber: (document.getElementById('bWhatsapp') as HTMLInputElement).value,
            logoUrl: logoUrl,
        };

        const res = await fetchWithAuth('/api/business', {
            method: currentBusiness ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Negocio guardado exitosamente');
            initDashboard();
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión o de subida de archivo');
    } finally {
        if (btn) btn.disabled = false;
    }
};

const renderDashboard = () => {
    appContent.innerHTML = `
        <div class="row mb-4 align-items-center">
            <div class="col-md-8 d-flex align-items-center gap-3">
                <img src="${currentBusiness.logoUrl || 'https://ui-avatars.com/api/?name=' + currentBusiness.name.replace(' ', '+')}" alt="Logo" class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover; border: 3px solid var(--primary-color);">
                <div>
                    <h2 class="fw-bold mb-1">${currentBusiness.name}</h2>
                    <p class="text-muted mb-0"><i class="ri-map-pin-line"></i> ${currentBusiness.city} | <a href="/tienda.html?slug=${currentBusiness.slug}" target="_blank">Ver tienda pública</a></p>
                </div>
            </div>
            <div class="col-md-4 text-md-end mt-3 mt-md-0">
                <button class="btn btn-outline-secondary rounded-pill me-2" onclick="editBusiness()">Editar Perfil</button>
                <button class="btn btn-primary-custom rounded-pill shadow" onclick="showProductModal()"><i class="ri-add-line"></i> Nuevo Producto</button>
            </div>
        </div>

        <div class="card p-4">
            <h4 class="fw-bold mb-4">Catálogo de Productos</h4>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Estado</th>
                            <th class="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.length === 0 ? `<tr><td colspan="5" class="text-center py-4 text-muted">Aún no tienes productos registrados. ¡Agrega tu primer producto!</td></tr>` : ''}
                        ${products.map(p => `
                            <tr>
                                <td><img src="${p.imageUrl || '/default-product.jpg'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                                <td class="fw-semibold">${p.title}</td>
                                <td>${Number(p.price) === -1 ? '<span class="text-muted fst-italic">A convenir</span>' : '$ ' + Number(p.price).toLocaleString('es-CO')}</td>
                                <td><span class="badge ${p.isAvailable ? 'bg-success' : 'bg-secondary'}">${p.isAvailable ? 'Disponible' : 'Oculto'}</span></td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-light text-primary" onclick='showProductModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'><i class="ri-edit-2-line"></i></button>
                                    <button class="btn btn-sm btn-light text-danger" onclick="deleteProduct('${p.id}')"><i class="ri-delete-bin-line"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// @ts-ignore - Expose helper
window.editBusiness = () => {
    renderSetupProfile();
    setTimeout(() => {
        (document.getElementById('bName') as HTMLInputElement).value = currentBusiness.name;
        (document.getElementById('bSlug') as HTMLInputElement).value = currentBusiness.slug;
        (document.getElementById('bCategory') as HTMLSelectElement).value = currentBusiness.categoryId;
        (document.getElementById('bDesc') as HTMLTextAreaElement).value = currentBusiness.description || '';
        (document.getElementById('bCity') as HTMLInputElement).value = currentBusiness.city;
        (document.getElementById('bWhatsapp') as HTMLInputElement).value = currentBusiness.whatsappNumber;
        (document.getElementById('bLogo') as HTMLInputElement).value = currentBusiness.logoUrl || '';
    }, 100);
};

window.showProductModal = (product: any = null) => {
    const form = document.getElementById('productForm') as HTMLFormElement;
    form.reset();
    
    if (product) {
        document.getElementById('productModalTitle')!.textContent = 'Editar Producto';
        (document.getElementById('productId') as HTMLInputElement).value = product.id;
        (document.getElementById('productName') as HTMLInputElement).value = product.title || product.name || '';
        (document.getElementById('productDesc') as HTMLTextAreaElement).value = product.description || '';
        
        const priceInput = document.getElementById('productPrice') as HTMLInputElement;
        const negotiableCb = document.getElementById('priceNegotiable') as HTMLInputElement;
        if (Number(product.price) === -1) {
            negotiableCb.checked = true;
            priceInput.value = '';
            priceInput.disabled = true;
            priceInput.required = false;
        } else {
            negotiableCb.checked = false;
            priceInput.disabled = false;
            priceInput.required = true;
            priceInput.value = (product.price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        (document.getElementById('productAvailable') as HTMLInputElement).checked = product.isAvailable;
        if (product.imageUrl) {
            document.getElementById('currentImageUrl')!.style.display = 'block';
        } else {
            document.getElementById('currentImageUrl')!.style.display = 'none';
        }
    } else {
        document.getElementById('productModalTitle')!.textContent = 'Agregar Producto';
        (document.getElementById('productId') as HTMLInputElement).value = '';
        const priceInput = document.getElementById('productPrice') as HTMLInputElement;
        const negotiableCb = document.getElementById('priceNegotiable') as HTMLInputElement;
        negotiableCb.checked = false;
        priceInput.disabled = false;
        priceInput.required = true;
        document.getElementById('currentImageUrl')!.style.display = 'none';
    }

    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
};

window.saveProduct = async (e: Event) => {
    e.preventDefault();
    const btn = document.getElementById('saveProductBtn') as HTMLButtonElement;
    btn.disabled = true;

    const id = (document.getElementById('productId') as HTMLInputElement).value;
    const fileInput = document.getElementById('productImageFile') as HTMLInputElement;
    let imageUrl = ''; // Current logic would retain it, but for simplicity let's rely on backend if we wanted to patch. 

    try {
        // Upload file first if exists
        if (fileInput.files && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (uploadRes.ok) {
                const upData = await uploadRes.json();
                imageUrl = upData.url; // Use full backend URL for images
            } else {
                throw new Error("Error subiendo imagen");
            }
        }

        const payload: any = {
            title: (document.getElementById('productName') as HTMLInputElement).value,
            description: (document.getElementById('productDesc') as HTMLTextAreaElement).value,
            price: (document.getElementById('priceNegotiable') as HTMLInputElement).checked ? -1 : parseFloat((document.getElementById('productPrice') as HTMLInputElement).value.replace(/\./g, '')),
            isAvailable: (document.getElementById('productAvailable') as HTMLInputElement).checked,
        };

        if (imageUrl) {
            payload.imageUrl = imageUrl;
        }

        const url = id ? `/api/products/${id}` : '/api/products';
        const method = id ? 'PUT' : 'POST';
        const res = await fetchWithAuth(url, {
            method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // @ts-ignore
            bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
            await loadProducts();
            renderDashboard();
        } else {
            alert('Error guardando producto');
        }
    } catch (err) {
        alert('Error de conexión');
    } finally {
        btn.disabled = false;
    }
};

window.deleteProduct = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    
    try {
        const res = await fetchWithAuth(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await loadProducts();
            renderDashboard();
        } else {
            alert('Error eliminando producto');
        }
    } catch (err) {
        alert('Error de conexión');
    }
};

initDashboard();
