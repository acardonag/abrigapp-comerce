declare global {
    interface Window {
        showApplyModal: () => void;
        submitApplication: (e: Event) => void;
        loadMoreCases: () => void;
        shareSupportCase: (name: string, id: string) => void;
    }
}

let currentPage = 0;
const pageSize = 20;

// Show Modal
window.showApplyModal = () => {
    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('applyModal'));
    modal.show();
};

// Submit form
window.submitApplication = async (e: Event) => {
    e.preventDefault();
    
    const btn = document.getElementById('applySubmitBtn') as HTMLButtonElement;
    const err = document.getElementById('applyError')!;
    const succ = document.getElementById('applySuccess')!;
    
    btn.disabled = true;
    err.style.display = 'none';
    succ.style.display = 'none';
    
    const data = {
        name: (document.getElementById('applyName') as HTMLInputElement).value,
        email: (document.getElementById('applyEmail') as HTMLInputElement).value,
        phone: (document.getElementById('applyPhone') as HTMLInputElement).value,
        city: (document.getElementById('applyCity') as HTMLInputElement).value,
        description: (document.getElementById('applyDescription') as HTMLTextAreaElement).value,
    };
    
    try {
        const response = await fetch('/api/support/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const resData = await response.json();
        
        if (response.ok) {
            succ.textContent = resData.message;
            succ.style.display = 'block';
            (document.getElementById('applyForm') as HTMLFormElement).reset();
        } else {
            err.textContent = resData.error || 'Ocurrió un error. Intenta nuevamente.';
            err.style.display = 'block';
        }
    } catch (error) {
        err.textContent = 'Error de conexión.';
        err.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
};

const calculateDaysRemaining = (publishedAt: string) => {
    if (!publishedAt) return 0;
    const pubDate = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - pubDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 10 - diffDays;
    return remaining > 0 ? remaining : 0;
};

const renderCases = async (reset = true) => {
    if (reset) {
        currentPage = 0;
        document.getElementById('casesDirectory')!.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 text-muted fw-medium">Cargando casos verificados...</p></div>`;
        document.getElementById('loadMoreContainer')!.style.display = 'none';
    }

    try {
        const query = new URLSearchParams({ limit: pageSize.toString(), offset: (currentPage * pageSize).toString() }).toString();
        const response = await fetch('/api/support/public-cases?' + query);
        const data = await response.json();
        
        const dir = document.getElementById('casesDirectory')!;
        if (reset) dir.innerHTML = '';

        if (data.length === 0 && reset) {
            dir.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="ri-hand-heart-line fs-1 mb-3 d-block text-primary"></i><h4>No hay casos activos por el momento</h4><p>¡Gracias por tu intención de ayudar!</p></div>`;
            return;
        }

        const html = data.map((c: any) => {
            const daysLeft = calculateDaysRemaining(c.publishedAt);
            
            // Extract Youtube ID if exists
            let videoHtml = '';
            let imageHtml = '';
            
            if (c.youtubeUrl) {
                const match = c.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                const videoId = match ? match[1] : null;
                if (videoId) {
                    videoHtml = `<iframe class="support-media" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
                }
            } else if (c.imageUrls) {
                try {
                    const imgs = JSON.parse(c.imageUrls);
                    if (imgs.length > 0) {
                        imageHtml = `<img src="${imgs[0]}" class="support-media" alt="Caso">`;
                    }
                } catch(e) {}
            }
            
            const mediaSection = videoHtml || imageHtml || `<div class="support-media bg-light d-flex align-items-center justify-content-center"><i class="ri-image-line fs-1 text-muted opacity-25"></i></div>`;

            return `
            <div class="col-lg-6 mb-4">
                <div class="card support-card h-100 position-relative">
                    <span class="badge bg-danger rounded-pill support-badge px-3 py-2 fs-6 shadow-sm">
                        <i class="ri-time-line me-1"></i> Faltan ${daysLeft} días
                    </span>
                    ${mediaSection}
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="card-title fw-bold text-dark mb-0">${c.name}</h3>
                            <button class="btn btn-light rounded-circle shadow-sm text-primary" style="width: 40px; height: 40px; padding:0;" onclick="shareSupportCase('${c.name}', '${c.id}')" title="Compartir caso">
                                <i class="ri-share-forward-line fs-5"></i>
                            </button>
                        </div>
                        <p class="text-muted small mb-3"><i class="ri-map-pin-line me-1"></i>${c.city}</p>
                        
                        <div class="mb-4">
                            <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill me-2">
                                <i class="ri-hand-heart-fill me-1"></i> Apoyo requerido: ${c.supportType || 'Ayuda general'}
                            </span>
                        </div>
                        
                        <p class="card-text text-secondary mb-4 flex-grow-1" style="font-size: 1.05rem; line-height: 1.6;">
                            ${c.description}
                        </p>
                        
                        <div class="bg-light p-3 rounded-3 mb-4 border">
                            <p class="mb-1 text-dark fw-medium fs-6"><i class="ri-bank-card-line me-2 text-primary"></i>Datos para aportar:</p>
                            <p class="mb-0 text-muted small ms-4">${c.donationAccount || 'Contactar por WhatsApp para acordar apoyo'}</p>
                        </div>
                        
                        <a href="https://wa.me/${c.phone}?text=${encodeURIComponent('¡Hola ' + c.name + '! Vi tu caso en AbrigApp y quiero apoyarte.')}" target="_blank" class="btn btn-success rounded-pill py-3 fw-bold w-100 shadow-sm mt-auto" style="font-size: 1.1rem;">
                            <i class="ri-whatsapp-line fs-4 me-2 align-middle"></i>Apoyar directamente
                        </a>
                    </div>
                </div>
            </div>`;
        }).join('');

        dir.innerHTML += html;

        const loadMoreBtn = document.getElementById('loadMoreContainer');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = data.length === pageSize ? 'block' : 'none';
        }
    } catch (e) {
        console.error('Error fetching cases', e);
    }
};

window.loadMoreCases = () => {
    currentPage++;
    renderCases(false);
};

window.shareSupportCase = (name: string, id: string) => {
    const shareUrl = `${window.location.origin}/apoyo.html?caseId=${id}`;
    if (navigator.share) {
        navigator.share({
            title: `Apoyemos a ${name}`,
            text: `Por favor apoya este caso en AbrigApp. Tu ayuda cuenta:`,
            url: shareUrl,
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        }).catch(err => {
            alert("No se pudo copiar el enlace. Cópialo manualmente: " + shareUrl);
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    renderCases(true);

    // Check for direct case link
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    if (caseId) {
        // @ts-ignore
        const detailModal = new bootstrap.Modal(document.getElementById('caseDetailModal'));
        detailModal.show();
        
        try {
            const response = await fetch(`/api/support/public-case/${caseId}`);
            if (!response.ok) throw new Error('Not found');
            
            const c = await response.json();
            const daysLeft = calculateDaysRemaining(c.publishedAt);
            
            let mediaSection = `<div class="bg-light d-flex align-items-center justify-content-center" style="height: 300px;"><i class="ri-image-line fs-1 text-muted opacity-25"></i></div>`;
            if (c.youtubeUrl) {
                const match = c.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                if (match && match[1]) {
                    mediaSection = `<iframe style="width: 100%; height: 350px;" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
                }
            } else if (c.imageUrls) {
                try {
                    const imgs = JSON.parse(c.imageUrls);
                    if (imgs.length > 0) {
                        mediaSection = `<img src="${imgs[0]}" alt="Caso" style="width: 100%; height: 350px; object-fit: cover;">`;
                    }
                } catch(e) {}
            }

            document.getElementById('caseDetailContent')!.innerHTML = `
                ${mediaSection}
                <div class="p-4 p-md-5">
                    <span class="badge bg-danger rounded-pill px-3 py-2 fs-6 shadow-sm mb-3">
                        <i class="ri-time-line me-1"></i> Faltan ${daysLeft} días
                    </span>
                    <h2 class="fw-bold text-dark mb-2">${c.name}</h2>
                    <p class="text-muted mb-4"><i class="ri-map-pin-line me-1"></i>${c.city}</p>
                    
                    <div class="mb-4">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fs-6">
                            <i class="ri-hand-heart-fill me-1"></i> ${c.supportType || 'Ayuda general'}
                        </span>
                    </div>
                    
                    <p class="text-secondary mb-4 fs-5" style="line-height: 1.6;">${c.description}</p>
                    
                    <div class="bg-light p-4 rounded-4 mb-4 border">
                        <h5 class="text-dark fw-bold mb-2"><i class="ri-bank-card-line me-2 text-primary"></i>Datos para aportar</h5>
                        <p class="mb-0 text-muted fs-5">${c.donationAccount || 'Contactar por WhatsApp para acordar el apoyo'}</p>
                    </div>
                    
                    <a href="https://wa.me/${c.phone}?text=${encodeURIComponent('¡Hola ' + c.name + '! Vi tu caso en AbrigApp y quiero apoyarte.')}" target="_blank" class="btn btn-success rounded-pill py-3 fw-bold w-100 shadow fs-5">
                        <i class="ri-whatsapp-line fs-4 me-2 align-middle"></i>Apoyar directamente
                    </a>
                </div>
            `;
            
            // Clean up URL after closing modal to prevent reloading it if user refreshes
            document.getElementById('caseDetailModal')?.addEventListener('hidden.bs.modal', () => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, { once: true });
            
        } catch (e) {
            document.getElementById('caseDetailContent')!.innerHTML = `
                <div class="text-center py-5">
                    <i class="ri-error-warning-line fs-1 text-danger mb-3 d-block"></i>
                    <h4 class="text-dark">Caso no encontrado</h4>
                    <p class="text-muted">Es posible que el caso ya no esté activo o haya sido resuelto.</p>
                    <button class="btn btn-outline-primary rounded-pill px-4 mt-3" data-bs-dismiss="modal">Ver otros casos</button>
                </div>
            `;
        }
    }
});
