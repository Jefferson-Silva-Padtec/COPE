// --- Inicializa o tema imediatamente para evitar flicker ---
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// --- Funcionalidade de Alteração de Tema ---
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Sai se o botão não existir

    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o toggle de tema
    initThemeToggle();

    // --- Funcionalidade de Recolher/Expandir Sidebar ---
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Referências aos elementos
    const uploadBox1 = document.getElementById('upload1');
    const uploadBox2 = document.getElementById('upload2');
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');
    const previewContainer1 = document.getElementById('preview1');
    const previewContainer2 = document.getElementById('preview2');

    // 1. Configura o clique da caixa para abrir o seletor de arquivo
    if (uploadBox1) uploadBox1.addEventListener('click', () => fileInput1.click());
    if (uploadBox2) uploadBox2.addEventListener('click', () => fileInput2.click());

    // Impede que o clique no input acione o clique da caixa, se for o caso
    if (fileInput1) fileInput1.addEventListener('click', (e) => e.stopPropagation());
    if (fileInput2) fileInput2.addEventListener('click', (e) => e.stopPropagation());


    // 2. Ouve a seleção de arquivo e chama a função de leitura
    if (fileInput1) fileInput1.addEventListener('change', (e) => handleFileSelect(e, previewContainer1));
    if (fileInput2) fileInput2.addEventListener('change', (e) => handleFileSelect(e, previewContainer2));

    // --- Funcionalidade Drag and Drop ---

    [uploadBox1, uploadBox2].forEach(box => {
        if (!box) return;
        // Previne comportamento padrão (necessário para drag and drop)
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.classList.add('drag-over'); // Adiciona classe visual
        });

        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.classList.remove('drag-over'); // Remove classe visual
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.classList.remove('drag-over'); // Remove classe visual
            
            // Pega os arquivos soltos
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const targetInput = box.id === 'upload1' ? fileInput1 : fileInput2;
                const targetPreview = box.id === 'upload1' ? previewContainer1 : previewContainer2;
                
                // Simula a seleção de arquivo no input
                const dataTransfer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                }
                targetInput.files = dataTransfer.files;

                // Chama o handler diretamente
                handleFileSelect({ target: targetInput }, targetPreview);
            }
        });
    });


    // --- Funções de Leitura e Exibição de Arquivo ---

    function handleFileSelect(event, previewContainer) {
        const files = event.target.files;
        if (files.length > 0) {
            if (files[0].size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande. Exibindo apenas prévia limitada.');
            }
            readFile(files[0], previewContainer);
        }
    }

    function readFile(file, previewContainer) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                displayPreview(jsonData, previewContainer);
            } catch (error) {
                previewContainer.style.display = 'block';
                previewContainer.innerHTML = `<p style="color: red;">Erro ao processar o arquivo: ${error.message}</p>`;
                console.error("Erro no processamento da planilha:", error);
            }
        };
        reader.readAsBinaryString(file);
    }

    function displayPreview(data, container) {
        container.innerHTML = '';
        const uploadBox = container.closest('.upload-box');
        const uploadText = uploadBox ? uploadBox.querySelector('p.upload-text') : null;
        if (uploadText) uploadText.style.display = 'none';
        container.style.display = 'block';
        if (data.length === 0) {
              container.innerHTML = '<p>Nenhum dado encontrado na planilha.</p>';
              return;
        }
        // ... (código de exibição da tabela omitido para brevidade, mantendo lógica original) ...
    }

    // --- Navegação SPA (Single Page Application) ---
    window.navigateTo = function(sectionId) {
        // 1. Esconde todas as seções
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        // 2. Mostra a seção alvo
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.add('active');
        // 3. Atualiza o item ativo no menu lateral
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav a[onclick*="'${sectionId}'"]`);
        if (activeLink && activeLink.parentElement) activeLink.parentElement.classList.add('active');
        // 4. Gerencia classes específicas de página
        if (sectionId === 'links-cope') document.body.classList.add('page-links-cope');
        else document.body.classList.remove('page-links-cope');
        // 5. Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});
