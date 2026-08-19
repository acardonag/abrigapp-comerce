let adminToken = localStorage.getItem('abrigapp_admin_token');
const loginSection = document.getElementById('loginSection')!;
const dashboardSection = document.getElementById('dashboardSection')!;
const logoutBtn = document.getElementById('logoutBtn')!;
const tableHead = document.getElementById('tableHead')!;
const tableBody = document.getElementById('tableBody')!;

let currentTab = 'businesses';
let dataList: any[] = [];

declare global {
    interface Window {
        loginAdmin: (e: Event) => void;
        logoutAdmin: () => void;
        switchTab: (tab: string) => void;
        deleteRecord: (id: string) => void;
        showCreateVolunteerModal: () => void;
        createVolunteer: (e: Event) => void;
    }
}

const checkAuth = () => {
    if (adminToken) {
        loginSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        logoutBtn.classList.remove('d-none');
        loadData();
    } else {
        loginSection.classList.remove('d-none');
        dashboardSection.classList.add('d-none');
        logoutBtn.classList.add('d-none');
    }
};

window.loginAdmin = async (e: Event) => {
    e.preventDefault();
    const email = (document.getElementById('adminEmail') as HTMLInputElement).value;
    const password = (document.getElementById('adminPass') as HTMLInputElement).value;

    try {
        const res = await fetch('/api/superadmin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('abrigapp_admin_token', data.token);
            adminToken = data.token;
            checkAuth();
        } else {
            alert('Credenciales incorrectas');
        }
    } catch (err) {
        alert('Error conectando al servidor');
    }
};

window.logoutAdmin = () => {
    localStorage.removeItem('abrigapp_admin_token');
    adminToken = null;
    checkAuth();
};

window.switchTab = (tab: string) => {
    currentTab = tab;
    document.getElementById('tab-businesses')!.className = tab === 'businesses' ? 'nav-link active btn-danger-custom' : 'nav-link bg-white text-dark border';
    document.getElementById('tab-products')!.className = tab === 'products' ? 'nav-link active btn-danger-custom' : 'nav-link bg-white text-dark border';
    document.getElementById('tab-volunteers')!.className = tab === 'volunteers' ? 'nav-link active btn-danger-custom' : 'nav-link bg-white text-dark border';
    
    if (tab === 'volunteers') {
        document.getElementById('volunteerActions')!.classList.remove('d-none');
    } else {
        document.getElementById('volunteerActions')!.classList.add('d-none');
    }
    
    loadData();
};

const loadData = async () => {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando...</td></tr>';
    try {
        const res = await fetch(`/api/superadmin/${currentTab}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.status === 401 || res.status === 403) {
            window.logoutAdmin();
            return;
        }
        if (res.ok) {
            dataList = await res.json();
            renderTable();
        }
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error cargando datos</td></tr>';
    }
};

const renderTable = () => {
    if (currentTab === 'businesses') {
        tableHead.innerHTML = `<tr><th>Nombre</th><th>Slug</th><th>Ciudad</th><th>WhatsApp</th><th class="text-end">Acción</th></tr>`;
        tableBody.innerHTML = dataList.map(b => `
            <tr>
                <td class="fw-bold">${b.name}</td>
                <td>${b.slug}</td>
                <td>${b.city}</td>
                <td>${b.whatsappNumber}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${b.id}')"><i class="ri-delete-bin-line"></i> Eliminar</button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="5" class="text-center py-4">No hay comercios</td></tr>`;
    } else if (currentTab === 'products') {
        tableHead.innerHTML = `<tr><th>Producto</th><th>Precio</th><th>Disponible</th><th class="text-end">Acción</th></tr>`;
        tableBody.innerHTML = dataList.map(p => `
            <tr>
                <td class="fw-bold">${p.title}</td>
                <td>$ ${p.price}</td>
                <td><span class="badge ${p.isAvailable ? 'bg-success' : 'bg-secondary'}">${p.isAvailable ? 'Sí' : 'No'}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${p.id}')"><i class="ri-delete-bin-line"></i> Eliminar</button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="4" class="text-center py-4">No hay productos</td></tr>`;
    } else if (currentTab === 'volunteers') {
        tableHead.innerHTML = `<tr><th>Nombre</th><th>Email</th><th>Celular</th><th class="text-end">Acción</th></tr>`;
        tableBody.innerHTML = dataList.map(v => `
            <tr>
                <td class="fw-bold">${v.name}</td>
                <td>${v.email}</td>
                <td>${v.phone || 'N/A'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${v.id}')"><i class="ri-delete-bin-line"></i> Eliminar</button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="4" class="text-center py-4">No hay voluntarios</td></tr>`;
    }
};

window.deleteRecord = async (id: string) => {
    let typeName = currentTab === 'businesses' ? 'comercio y todos sus productos' : 'producto';
    if (currentTab === 'volunteers') typeName = 'voluntario';
    
    if (!confirm(`¿Estás seguro de eliminar este ${typeName} permanentemente? Esto no se puede deshacer.`)) return;

    try {
        let endpoint = `/api/superadmin/product/${id}`;
        if (currentTab === 'businesses') endpoint = `/api/superadmin/business/${id}`;
        if (currentTab === 'volunteers') endpoint = `/api/superadmin/volunteer/${id}`;
        
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
            loadData();
        } else {
            alert('Error al eliminar');
        }
    } catch (err) {
        alert('Error conectando al servidor');
    }
};

window.showCreateVolunteerModal = () => {
    // @ts-ignore
    const modal = new bootstrap.Modal(document.getElementById('volunteerModal'));
    modal.show();
};

window.createVolunteer = async (e: Event) => {
    e.preventDefault();
    const name = (document.getElementById('volName') as HTMLInputElement).value;
    const email = (document.getElementById('volEmail') as HTMLInputElement).value;
    const password = (document.getElementById('volPass') as HTMLInputElement).value;
    const phone = (document.getElementById('volPhone') as HTMLInputElement).value;

    try {
        const res = await fetch('/api/superadmin/volunteer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ name, email, password, phone })
        });
        
        if (res.ok) {
            // @ts-ignore
            bootstrap.Modal.getInstance(document.getElementById('volunteerModal')).hide();
            (document.getElementById('volunteerForm') as HTMLFormElement).reset();
            loadData();
        } else {
            alert('Error al crear voluntario');
        }
    } catch (err) {
        alert('Error de conexión');
    }
};

checkAuth();
