// Mock data for display while DB is not connected
const mockCategories = [
    { id: '1', name: "Alimentos & Gastronomía" },
    { id: '2', name: "Ropa, Calzado & Moda" },
    { id: '3', name: "Artesanías & Decoración" }
];

const mockBusinesses = [
    { id: '1', name: "Panadería El Buen Sabor", category: "Alimentos & Gastronomía", city: "Armenia", slug: "panaderia-el-buen-sabor", logoUrl: "", whatsappNumber: "573000000000" },
    { id: '2', name: "Confecciones María", category: "Ropa, Calzado & Moda", city: "Pereira", slug: "confecciones-maria", logoUrl: "", whatsappNumber: "573000000000" },
    { id: '3', name: "Artesanías Quindío", category: "Artesanías & Decoración", city: "Salento", slug: "artesanias-quindio", logoUrl: "", whatsappNumber: "573000000000" }
];

declare global {
    interface Window {
        loadDirectory: () => void;
        showLoginModal: () => void;
        requestOtp: () => void;
        verifyOtp: () => void;
        shareBusiness: (name: string, slug: string) => void;
    }
}

// UI Helpers for Login Modal
const showLoginError = (msg: string) => {
    const el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
};
const toggleLoginLoading = (show: boolean, text: string = 'Cargando...') => {
    document.getElementById('loginLoading')!.style.display = show ? 'block' : 'none';
    document.getElementById('loginLoadingText')!.textContent = text;
    document.getElementById('stepEmail')!.style.display = show ? 'none' : (document.getElementById('stepOtp')!.style.display === 'block' ? 'none' : 'block');
    if(show) document.getElementById('stepOtp')!.style.display = 'none';
};

// Load Categories
const loadCategories = async () => {
    let data = mockCategories;
    try {
        const response = await fetch('/api/public/categories');
        if (response.ok) {
            data = await response.json();
        }
    } catch (e) {
        console.warn("Using mock categories");
    }

    const catFilter = document.getElementById('categoryFilter');
    if (catFilter) {
        data.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id || cat.name;
            opt.textContent = cat.name;
            catFilter.appendChild(opt);
        });
    }
};

// Load Directory
window.loadDirectory = async () => {
    const category = (document.getElementById('categoryFilter') as HTMLSelectElement)?.value || '';
    const city = (document.getElementById('cityFilter') as HTMLSelectElement)?.value || '';

    let data = mockBusinesses;
    try {
        const query = new URLSearchParams({ category, city }).toString();
        const response = await fetch('/api/public/businesses?' + query);
        if (response.ok) {
            data = await response.json();
        } else {
            throw new Error("DB Error");
        }
    } catch (e) {
        console.warn("Using mock businesses. Filters applied locally.");
        data = mockBusinesses.filter(b => {
            const matchCat = category ? b.category === category || b.id === category : true;
            const matchCity = city ? b.city === city : true;
            return matchCat && matchCity;
        });
    }

    const dir = document.getElementById('directory');
    if (dir) {
        if (data.length === 0) {
            dir.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="ri-search-line fs-1"></i><p>No se encontraron comercios</p></div>`;
            return;
        }

        dir.innerHTML = data.map((b: any) => `
            <div class="col-xl-3 col-lg-4 col-md-6">
                <div class="store-card d-flex flex-column position-relative">
                    <button class="btn btn-light bg-white rounded-circle shadow-sm position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center text-primary" style="z-index: 10; width: 35px; height: 35px; padding: 0;" onclick="shareBusiness('${b.name}', '${b.slug}')" title="Compartir comercio">
                        <i class="ri-share-forward-line fs-5"></i>
                    </button>
                    <div class="store-cover"></div>
                    <div class="px-3 pb-4 text-center flex-grow-1 d-flex flex-column">
                        <img src="${b.logoUrl || 'https://ui-avatars.com/api/?name=' + b.name.replace(' ', '+') + '&background=random'}" alt="${b.name}" class="store-logo mx-auto mb-3">
                        <h5 class="fw-bold mb-1">${b.name}</h5>
                        <p class="text-muted small mb-2"><i class="ri-map-pin-line"></i> ${b.city}</p>
                        <div class="mb-3">
                            <span class="badge badge-category rounded-pill px-3 py-2">${b.category}</span>
                        </div>
                        <div class="mt-auto d-flex flex-column gap-2">
                            <a href="/tienda.html?slug=${b.slug}" class="btn btn-outline-dark rounded-pill">Ver Catálogo</a>
                            <a href="https://wa.me/${(b.whatsappNumber.replace(/[^0-9]/g, '').length === 10 ? '57' : '') + b.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola, vi tu tienda en AbrigApp y me gustaría apoyar comprando..." target="_blank" class="btn btn-whatsapp d-flex align-items-center justify-content-center gap-2">
                                <i class="ri-whatsapp-line fs-5"></i> Contactar
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// Modals
window.showLoginModal = () => {
    // Reset modal state
    document.getElementById('stepEmail')!.style.display = 'block';
    document.getElementById('stepOtp')!.style.display = 'none';
    (document.getElementById('loginEmail') as HTMLInputElement).value = '';
    (document.getElementById('loginOtp') as HTMLInputElement).value = '';
    showLoginError('');
    
    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
};

window.requestOtp = async () => {
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    if (!email || !email.includes('@')) return showLoginError("Por favor ingresa un correo válido.");

    toggleLoginLoading(true, "Enviando código a tu correo...");
    showLoginError('');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            // Mock mode if DB fails
            if (data.error === 'Internal server error' || res.status === 500) {
                console.warn("Backend DB error. Mocking OTP success for testing.");
                toggleLoginLoading(false);
                document.getElementById('stepEmail')!.style.display = 'none';
                document.getElementById('stepOtp')!.style.display = 'block';
                return;
            }
            throw new Error(data.error || 'Error al solicitar OTP');
        }
        
        toggleLoginLoading(false);
        document.getElementById('stepEmail')!.style.display = 'none';
        document.getElementById('stepOtp')!.style.display = 'block';
    } catch (e: any) {
        toggleLoginLoading(false);
        showLoginError(e.message || "Error de conexión con el servidor.");
    }
};

window.verifyOtp = async () => {
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    const otp = (document.getElementById('loginOtp') as HTMLInputElement).value;
    
    if (!otp || otp.length !== 6) return showLoginError("Ingresa el código de 6 dígitos.");

    toggleLoginLoading(true, "Verificando...");
    showLoginError('');

    try {
        const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            // Mock mode
            if (data.error === 'Internal server error' || res.status === 500) {
                console.warn("Backend DB error. Mocking OTP verification.");
                if (otp === "123456") {
                    data.token = "mock_token";
                } else {
                    throw new Error("Código inválido (Usa 123456 para probar)");
                }
            } else {
                throw new Error(data.error || 'Código inválido');
            }
        }
        
        // Success
        localStorage.setItem('abrigapp_token', data.token);
        toggleLoginLoading(false);
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
        window.location.href = '/dashboard.html';
    } catch (e: any) {
        toggleLoginLoading(false);
        showLoginError(e.message);
    }
};

// Init
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

const init = async () => {
    // Check auth state
    const token = localStorage.getItem('abrigapp_token');
    if (token) {
        const loginBtn = document.querySelector('button[onclick="showLoginModal()"]');
        if (loginBtn) {
            loginBtn.textContent = 'Ir a mi Panel';
            loginBtn.setAttribute('onclick', "window.location.href='/dashboard.html'");
            loginBtn.classList.replace('btn-outline-primary', 'btn-primary');
        }
    }

    await loadCategories();
    window.loadDirectory();

    // Show promo video modal once per session
    if (!sessionStorage.getItem('abrigapp_video_seen')) {
        setTimeout(() => {
            const modalEl = document.getElementById('videoModal');
            if (modalEl) {
                // @ts-ignore
                const videoModal = new bootstrap.Modal(modalEl);
                videoModal.show();
                sessionStorage.setItem('abrigapp_video_seen', 'true');
                
                modalEl.addEventListener('shown.bs.modal', () => {
                    const video = document.getElementById('promoVideo') as HTMLVideoElement;
                    if (video) video.play().catch(e => console.log('Autoplay prevented by browser'));
                });
                
                modalEl.addEventListener('hidden.bs.modal', () => {
                    const video = document.getElementById('promoVideo') as HTMLVideoElement;
                    if (video) video.pause();
                });
            }
        }, 1000); // 1s delay so the page loads first
    }
};

document.addEventListener('DOMContentLoaded', init);
