import './index.css';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if(!token) {
        document.getElementById('loadingState')!.style.display = 'none';
        document.getElementById('errorState')!.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('/api/support/verify/' + token);
        const data = await response.json();
        
        document.getElementById('loadingState')!.style.display = 'none';
        
        if (response.ok) {
            document.getElementById('successState')!.style.display = 'block';
        } else {
            document.getElementById('errorState')!.style.display = 'block';
            document.getElementById('errorMsg')!.textContent = data.error || 'El enlace es inválido o expiró.';
        }
    } catch (error) {
        document.getElementById('loadingState')!.style.display = 'none';
        document.getElementById('errorState')!.style.display = 'block';
    }
});
