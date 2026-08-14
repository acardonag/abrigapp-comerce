import fs from 'fs';

const fetchAndFixTemplate = async () => {
    let html = fs.readFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\b1fa34a0-0016-48ad-9964-128141066de4\\.system_generated\\steps\\155\\content.md', 'utf-8');
    
    // Remove the headers added by read_url_content
    const separator = '---';
    const parts = html.split(separator);
    if (parts.length > 1) {
        html = parts.slice(1).join(separator).trim();
    }
    
    // Replace relative assets with absolute URLs
    html = html.replace(/href="assets\//g, 'href="https://maraviyainfotech.com/projects/sprazo-html/sprazo-html/assets/');
    html = html.replace(/src="assets\//g, 'src="https://maraviyainfotech.com/projects/sprazo-html/sprazo-html/assets/');
    
    // Insert our script at the end of body
    html = html.replace('</body>', '<script type="module" src="/src/main.ts"></script></body>');
    
    // Insert a container for our directory inside the main content area
    html = html.replace('<!-- Category section start -->', `
    <!-- Custom Directory -->
    <section class="sp-category-section padding-t-100">
        <div class="container">
            <div class="row mb-5">
                <div class="col-12 text-center">
                    <h2 class="mb-2" style="color: #64b496;">Directorio Solidario</h2>
                    <p>Encuentra comercios locales y apoya la reactivación.</p>
                </div>
            </div>
            <div class="row" id="directory">
                <div class="col-12 text-center" id="loading-directory">
                    <div class="spinner-border text-success" role="status"></div>
                </div>
            </div>
        </div>
    </section>
    <!-- Category section start -->`);

    fs.writeFileSync('index.html', html);
    console.log('Template fetched from cache and patched');
};

fetchAndFixTemplate();
