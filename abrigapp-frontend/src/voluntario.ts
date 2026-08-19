let volunteerToken = localStorage.getItem('abrigapp_volunteer_token');
let volunteerInfo = JSON.parse(localStorage.getItem('abrigapp_volunteer_info') || 'null');
let allCases: any[] = [];
let currentFilter = 'En revision';

declare global {
    interface Window {
        loginVolunteer: (e: Event) => void;
        logoutVolunteer: () => void;
        loadCases: () => void;
        filterByStatus: (status: string, el: HTMLElement) => void;
        openReviewModal: (id: string) => void;
        updateCase: (e: Event) => void;
    }
}

const checkAuth = () => {
    if (volunteerToken) {
        document.getElementById('loginSection')!.classList.add('d-none');
        document.getElementById('dashboardSection')!.classList.remove('d-none');
        document.getElementById('volunteerInfo')!.classList.remove('d-none');
        document.getElementById('volunteerNameLabel')!.textContent = `Voluntario: ${volunteerInfo?.name || ''}`;
        window.loadCases();
    } else {
        document.getElementById('loginSection')!.classList.remove('d-none');
        document.getElementById('dashboardSection')!.classList.add('d-none');
        document.getElementById('volunteerInfo')!.classList.add('d-none');
    }
};

window.loginVolunteer = async (e: Event) => {
    e.preventDefault();
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    const password = (document.getElementById('loginPass') as HTMLInputElement).value;
    const err = document.getElementById('loginError')!;

    try {
        const res = await fetch('/api/volunteer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('abrigapp_volunteer_token', data.token);
            localStorage.setItem('abrigapp_volunteer_info', JSON.stringify(data.volunteer));
            volunteerToken = data.token;
            volunteerInfo = data.volunteer;
            err.classList.add('d-none');
            checkAuth();
        } else {
            err.textContent = data.error || 'Credenciales inválidas';
            err.classList.remove('d-none');
        }
    } catch (error) {
        err.textContent = 'Error de conexión';
        err.classList.remove('d-none');
    }
};

window.logoutVolunteer = () => {
    localStorage.removeItem('abrigapp_volunteer_token');
    localStorage.removeItem('abrigapp_volunteer_info');
    volunteerToken = null;
    volunteerInfo = null;
    checkAuth();
};

window.loadCases = async () => {
    const grid = document.getElementById('casesGrid')!;
    grid.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`;
    
    try {
        const res = await fetch('/api/volunteer/cases', {
            headers: { 'Authorization': `Bearer ${volunteerToken}` }
        });
        
        if (res.status === 401 || res.status === 403) {
            window.logoutVolunteer();
            return;
        }
        
        if (res.ok) {
            allCases = await res.json();
            renderCases();
        }
    } catch (err) {
        grid.innerHTML = `<div class="col-12 text-center text-danger py-5">Error cargando casos</div>`;
    }
};

window.filterByStatus = (status: string, el: HTMLElement) => {
    currentFilter = status;
    document.querySelectorAll('#statusTabs .nav-link').forEach(link => {
        link.className = 'nav-link bg-light border fw-medium text-muted rounded-top';
    });
    el.className = 'nav-link active bg-white shadow-sm border fw-medium text-dark rounded-top';
    renderCases();
};

const renderCases = () => {
    const grid = document.getElementById('casesGrid')!;
    const filtered = allCases.filter(c => c.status === currentFilter);
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">No hay casos en estado "${currentFilter}"</div>`;
        return;
    }
    
    grid.innerHTML = filtered.map(c => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card case-card h-100 shadow-sm border" onclick="openReviewModal('${c.id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="fw-bold mb-0 text-truncate" style="max-width: 70%;">${c.name}</h5>
                        <span class="badge ${c.status === 'Aprobado' ? 'bg-success' : c.status === 'Rechazado' ? 'bg-danger' : c.status === 'En revision' ? 'bg-warning text-dark' : 'bg-secondary'}">${c.status}</span>
                    </div>
                    <p class="text-muted small mb-2"><i class="ri-map-pin-line me-1"></i>${c.city}</p>
                    <p class="text-truncate mb-0 text-secondary" style="max-height: 45px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${c.description}</p>
                </div>
                <div class="card-footer bg-white border-top-0 pt-0">
                    <small class="text-muted"><i class="ri-time-line me-1"></i>${new Date(c.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        </div>
    `).join('');
};

window.openReviewModal = (id: string) => {
    const c = allCases.find(x => x.id === id);
    if (!c) return;
    
    document.getElementById('caseId')!.value = c.id;
    (document.getElementById('updateName') as HTMLInputElement).value = c.name;
    (document.getElementById('updateEmail') as HTMLInputElement).value = c.email;
    (document.getElementById('updatePhone') as HTMLInputElement).value = c.phone;
    (document.getElementById('updateCity') as HTMLInputElement).value = c.city;
    (document.getElementById('updateDescription') as HTMLInputElement).value = c.description;
    
    const badge = document.getElementById('caseStatusBadge')!;
    badge.textContent = c.status;
    badge.className = `badge fs-6 ${c.status === 'Aprobado' ? 'bg-success' : c.status === 'Rechazado' ? 'bg-danger' : c.status === 'En revision' ? 'bg-warning text-dark' : 'bg-secondary'}`;
    
    (document.getElementById('updateStatus') as HTMLSelectElement).value = c.status;
    (document.getElementById('updateType') as HTMLInputElement).value = c.supportType || '';
    (document.getElementById('updateAccount') as HTMLInputElement).value = c.donationAccount || '';
    (document.getElementById('updateYoutube') as HTMLInputElement).value = c.youtubeUrl || '';
    
    document.getElementById('updateError')!.classList.add('d-none');
    
    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
};

window.updateCase = async (e: Event) => {
    e.preventDefault();
    const id = (document.getElementById('caseId') as HTMLInputElement).value;
    const name = (document.getElementById('updateName') as HTMLInputElement).value;
    const email = (document.getElementById('updateEmail') as HTMLInputElement).value;
    const phone = (document.getElementById('updatePhone') as HTMLInputElement).value;
    const city = (document.getElementById('updateCity') as HTMLInputElement).value;
    const description = (document.getElementById('updateDescription') as HTMLInputElement).value;
    
    const status = (document.getElementById('updateStatus') as HTMLSelectElement).value;
    const supportType = (document.getElementById('updateType') as HTMLSelectElement).value;
    const donationAccount = (document.getElementById('updateAccount') as HTMLInputElement).value;
    const youtubeUrl = (document.getElementById('updateYoutube') as HTMLInputElement).value;
    const photoInput = document.getElementById('updatePhoto') as HTMLInputElement;
    const err = document.getElementById('updateError')!;
    const submitBtn = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        let imageUrls = undefined;
        const c = allCases.find(x => x.id === id);
        
        // Ensure photo if approved and no previous photo exists
        if (status === 'Aprobado') {
            const hasExistingPhoto = c?.imageUrls && JSON.parse(c.imageUrls).length > 0;
            if (!hasExistingPhoto && (!photoInput.files || photoInput.files.length === 0)) {
                err.textContent = 'Debe adjuntar una foto para aprobar y publicar el caso.';
                err.classList.remove('d-none');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
                return;
            }
        }
        
        // Upload photo if selected
        if (photoInput.files && photoInput.files.length > 0) {
            const file = photoInput.files[0];
            
            // Compresión de imagen del lado del cliente para evitar límite 4.5MB/10s de Vercel Proxy
            const compressedFile = await new Promise<File>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target?.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 1000;
                        if (width > height && width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        } else if (height > maxDim) {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);
                        canvas.toBlob((blob) => {
                            if (blob) resolve(new File([blob], file.name, { type: file.type || 'image/jpeg' }));
                            else reject(new Error("Fallo al comprimir imagen"));
                        }, file.type || 'image/jpeg', 0.7);
                    };
                };
                reader.onerror = error => reject(error);
            });

            const formData = new FormData();
            formData.append('file', compressedFile);
            
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${volunteerToken}` },
                body: formData
            });
            
            if (!uploadRes.ok) {
                throw new Error('Error al subir la imagen. Intenta con una foto más pequeña.');
            }
            const uploadData = await uploadRes.json();
            imageUrls = [uploadData.url];
        }

        const res = await fetch(`/api/volunteer/case/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${volunteerToken}` },
            body: JSON.stringify({ name, email, phone, city, description, status, supportType, donationAccount, youtubeUrl, imageUrls })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            photoInput.value = ''; // Reset photo input
            // @ts-ignore
            bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
            window.loadCases();
        } else {
            err.textContent = data.error || 'Error al actualizar caso';
            err.classList.remove('d-none');
        }
    } catch (error: any) {
        err.textContent = error.message || 'Error de conexión';
        err.classList.remove('d-none');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
    }
};

document.addEventListener('DOMContentLoaded', checkAuth);
