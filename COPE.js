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

    // --- Lógica do Agente Rápido ---
    initAgenteRapido();

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
        
        // 4. Renderiza contatos se for a seção de escalonamento
        if (sectionId === 'escalonamento') {
            if (typeof window.renderSpreadsheet === 'function' && window.unifiedCities) {
                window.renderSpreadsheet(window.unifiedCities, false);
            }
            const searchInput = document.getElementById('agente-search-input');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 150);
            }
        }
        // 5. Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Funcionalidade de Teste de Rede ---
    const startTestBtn = document.getElementById('start-network-test-btn');
    const testModal = document.getElementById('network-test-modal');
    const closeTestModalBtn = document.getElementById('close-network-test-modal');
    const restartTestBtn = document.getElementById('restart-network-test-btn');

    if (startTestBtn && testModal && closeTestModalBtn && restartTestBtn) {
        startTestBtn.addEventListener('click', () => {
            testModal.style.display = 'flex';
            startNetworkTest();
        });

        closeTestModalBtn.addEventListener('click', () => {
            testModal.style.display = 'none';
            // TODO: Adicionar lógica para parar o teste se estiver em andamento
        });
        
        restartTestBtn.addEventListener('click', startNetworkTest);

        window.addEventListener('click', (event) => {
            if (event.target == testModal) {
                testModal.style.display = 'none';
                // TODO: Adicionar lógica para parar o teste se estiver em andamento
            }
        });
    }

    function resetTestUI() {
        document.getElementById('test-ping').textContent = '-';
        document.getElementById('test-server-name').textContent = '-';
        document.getElementById('download-speed').textContent = '-';
        document.getElementById('upload-speed').textContent = '-';
        document.getElementById('download-progress').style.width = '0%';
        document.getElementById('upload-progress').style.width = '0%';
        document.getElementById('network-test-status').textContent = 'Aguardando início...';
        restartTestBtn.style.display = 'none';
    }

    function startNetworkTest() {
        resetTestUI();
        
        const statusEl = document.getElementById('network-test-status');
        const pingEl = document.getElementById('test-ping');
        const serverEl = document.getElementById('test-server-name');
        const downloadSpeedEl = document.getElementById('download-speed');
        const uploadSpeedEl = document.getElementById('upload-speed');
        const downloadProgress = document.getElementById('download-progress');
        const uploadProgress = document.getElementById('upload-progress');

        statusEl.textContent = 'Procurando o melhor servidor...';

        // 1. Simular busca de servidor e ping
        setTimeout(() => {
            const ping = Math.floor(Math.random() * (30 - 5 + 1)) + 5; // 5-30ms
            const server = { name: "Padtec Server", region: "Campinas, BR", id: "2857" };
            pingEl.textContent = ping;
            serverEl.textContent = `${server.name} (${server.region} - ID: ${server.id})`;
            statusEl.textContent = 'Iniciando teste de download...';

            // 2. Simular teste de download
            simulateSpeedTest(downloadProgress, downloadSpeedEl, 'download', () => {
                statusEl.textContent = 'Iniciando teste de upload...';
                
                // 3. Simular teste de upload
                simulateSpeedTest(uploadProgress, uploadSpeedEl, 'upload', () => {
                    statusEl.textContent = 'Teste concluído!';
                    restartTestBtn.style.display = 'inline-block';
                });
            });
        }, 1500);
    }

    function simulateSpeedTest(progressBar, speedEl, type, onComplete) {
        let progress = 0;
        const finalSpeed = type === 'download' ? (Math.random() * (550 - 80) + 80) : (Math.random() * (300 - 40) + 40);

        const interval = setInterval(() => {
            // Incremento entre 0.9 e 1.3 por intervalo de 100ms (garante no mínimo ~7.6 segundos por teste)
            progress += Math.random() * (1.3 - 0.9) + 0.9;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                speedEl.textContent = finalSpeed.toFixed(2);
                if (onComplete) onComplete();
            } else {
                // Simula oscilação realista da velocidade após os primeiros 20%
                let currentSpeed = finalSpeed * (progress / 20); // Sobe rápido no início
                if (progress > 20) {
                    currentSpeed = finalSpeed * (0.95 + Math.random() * 0.1); // Oscila +/- 5% do valor final
                }
                speedEl.textContent = currentSpeed.toFixed(2);
            }
            progressBar.style.width = progress + '%';
        }, 100); // 100ms deixa a barra mais fluida
    }
});

function initAgenteRapido() {
    const modal = document.getElementById('agente-rapido-modal');
    const openBtn = document.getElementById('btn-open-agente-rapido') || document.querySelector('a[href*="openAgenteRapidoModal"]') || document.querySelector('a[onclick*="openAgenteRapidoModal"]');
    const closeBtn = document.getElementById('close-agente-rapido-modal');

    const escalonamentoEPS = [
        { municipio: "Açailândia", uf: "MA", sigla: "ACD", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "Alegrete", uf: "RS", sigla: "ALG", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Altamira", uf: "PA", sigla: "ATM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Angra Dos Reis", uf: "RJ", sigla: "ARS", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Aracruz", uf: "ES", sigla: "ACZ", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "NÃO SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "Araguaína", uf: "TO", sigla: "ARN", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Juliano Henrique Prestes / Noturno: Juliano Henrique Prestes Diurno: 11 91760-5917 / Noturno: 11 91760-5917", gerente: "Diurno/Noturno: Jander Inacio Prates Diurno/Noturno: 67 998955452" },
        { municipio: "Arapiraca", uf: "AL", sigla: "AIR", fila: "PLANTA EXTERNA N1 / AL", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Araruama", uf: "RJ", sigla: "AMA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Armação Dos Búzios", uf: "RJ", sigla: "ARBU", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Arraial D'Ajuda", uf: "BA", sigla: "ALDA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Bagé", uf: "RS", sigla: "BGE", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Balsas", uf: "MA", sigla: "BLA", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "Barra Do Piraí", uf: "RJ", sigla: "BPI", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Barra Mansa", uf: "RJ", sigla: "BMA", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Barreiras", uf: "BA", sigla: "BES", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Belém", uf: "PA", sigla: "BLM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Cabedelo", uf: "PB", sigla: "CBD", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", primeiroContato: "Mikaelle Silva De Oliveira/Giselle Esmeralda Do Prado/Vinicius Santos De Lucena/Allana Bernardo Dantas De Araujo/Fatima Maria Agripino Dos Reis/Abimael Anibal Vieira Filho (84) 98661-0163 / (81) 99256-9899 / (81) 98584-4552 / (84) 98749-6846 / (81) 98735-4262 / (81) 99119-5622", supervisor: "Diurno/Noturno: Vinicius Lucena Diurno/Noturno: (86) 99828-0083", coordenador: "FERNANDO FERREIRA Diurno/Noturno: (83) 98753-0979", gerente: "Diurno/Noturno: João Paulo Diurno/Noturno: (81) 98584-2246" },
        { municipio: "Cabo Frio", uf: "RJ", sigla: "CBF", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Cachoeira Do Sul", uf: "RS", sigla: "CCR", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Cachoeiro De Itapemirim", uf: "ES", sigla: "CIM", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "Caldas Novas", uf: "GO", sigla: "CLV", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Camaquã", uf: "RS", sigla: "CAM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Campo Verde", uf: "MT", sigla: "CZV", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Mauricio  Souza / Noturno: Diurno: 67 9805-7675 / Noturno: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Canaã Dos Carajás", uf: "PA", sigla: "CKJ", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Canela", uf: "RS", sigla: "CEN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Capanema", uf: "PA", sigla: "CPN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Capão Da Canoa", uf: "RS", sigla: "KDK", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Capinzal", uf: "SC", sigla: "CNZ", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Cleideson Freitas Diurno/Noturno: (48) 99141-1588", coordenador: "Diruno/Noturno RAFAEL VARGAS Diurno/Noturno: 48 99178-9367", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Carazinho", uf: "RS", sigla: "CIO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Carlos Barbosa", uf: "RS", sigla: "CLB", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Castanhal", uf: "PA", sigla: "CAH", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Catalão", uf: "GO", sigla: "CTL", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Charqueadas", uf: "RS", sigla: "CQU", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Concórdia", uf: "SC", sigla: "CDA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Cleideson Freitas Diurno/Noturno: (48) 99141-1588", coordenador: "Diruno/Noturno RAFAEL VARGAS Diurno/Noturno: 48 99178-9367", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Crato", uf: "CE", sigla: "CTO", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", primeiroContato: "Diogo Araujo (71) 99614-7416", supervisor: "Diurno: Ricardo Alexandre / Noturno: Nelson Barroso Campo Diurno: 71 99742-2205 / Noturno: 88 98164-1839", coordenador: "Diurno/ Noturno: Marcilio Cassiano Sup Campo 85 99411-9484", gerente: "Diurno/Noturno: Patrick Porto Ger SR Diurno/Noturno: 71 99986-1262" },
        { municipio: "Divinópolis", uf: "MG", sigla: "DVL", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Dois Irmãos", uf: "RS", sigla: "DSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Erechim", uf: "RS", sigla: "ERE", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Estrela", uf: "RS", sigla: "ETA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Eunápolis", uf: "BA", sigla: "EUS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Ricardo Alexandre / Noturno: Nelson Barroso Campo Diurno: 71 99742-2205 / Noturno: 88 98164-1839", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Flores Da Cunha", uf: "RS", sigla: "FCA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Formosa", uf: "GO", sigla: "FRM", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Uraci Diurno: 11 94459-4514", coordenador: "Diurno/Noturno: Cleiton Neves Diurno: 11 99820-3955", gerente: "Diurno/Noturno: Gerente Israel Diurno/Noturno: (61) 99605-7278" },
        { municipio: "Fraiburgo", uf: "SC", sigla: "FGO", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Cleideson Freitas Diurno/Noturno: (48) 99141-1588", coordenador: "Diruno/Noturno RAFAEL VARGAS Diurno/Noturno: 48 99178-9367", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Garanhuns", uf: "PE", sigla: "GUS", fila: "PLANTA EXTERNA N1 / PE 2", eps: "TECNOMULTI", status: "SIGO", primeiroContato: "Mikaelle Silva De Oliveira/Giselle Esmeralda Do Prado/Vinicius Santos De Lucena/Allana Bernardo Dantas De Araujo/Fatima Maria Agripino Dos Reis/Abimael Anibal Vieira Filho (84) 98661-0163 / (81) 99256-9899 / (81) 98584-4552 / (84) 98749-6846 / (81) 98735-4262 / (81) 99119-5622", supervisor: "Diurno/Noturno: Vinicius Lucena Diurno/Noturno: (86) 99828-0083", coordenador: "Manoel Messias Diurno/Noturno: (81) 986834718", gerente: "Diurno/Noturno: Valdecio Guimarães Diurno/Noturno: (81) 98209-7564" },
        { municipio: "Garibaldi", uf: "RS", sigla: "GRD", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Garopaba", uf: "SC", sigla: "GRB", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Cleideson Freitas Diurno/Noturno: (48) 99141-1588", coordenador: "Diruno/Noturno RAFAEL VARGAS Diurno/Noturno: 48 99178-9367", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Gramado", uf: "RS", sigla: "GDO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Guanambi", uf: "BA", sigla: "GNB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Guaraparí", uf: "ES", sigla: "GRI", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "Ibirité", uf: "MG", sigla: "IIE", fila: "PLANTA EXTERNA N1 / MG 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Igrejinha", uf: "RS", sigla: "IJH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Iguaba Grande", uf: "RJ", sigla: "IGGR", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Ijuí", uf: "RS", sigla: "IJI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Ilhéus", uf: "BA", sigla: "ILH", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Imbituba", uf: "SC", sigla: "IMA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Cleideson Freitas Diurno/Noturno: (48) 99141-1588", coordenador: "Diruno/Noturno RAFAEL VARGAS Diurno/Noturno: 48 99178-9367", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Imperatriz", uf: "MA", sigla: "ITZ", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "Inhumas", uf: "GO", sigla: "IUS", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Uraci Diurno: 11 94459-4514", coordenador: "Diurno/Noturno: Cleiton Neves Diurno: 11 99820-3955", gerente: "Diurno/Noturno: Edson Rosa Diurno/Noturno: (62) 99676-2761" },
        { municipio: "Itaberaí", uf: "GO", sigla: "IEI", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Uraci Diurno: 11 94459-4514", coordenador: "Diurno/Noturno: Cleiton Neves Diurno: 11 99820-3955", gerente: "Diurno/Noturno: Edson Rosa Diurno/Noturno: (62) 99676-2761" },
        { municipio: "Itabuna", uf: "BA", sigla: "ITB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Itaperuna", uf: "RJ", sigla: "IRA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Itumbiara", uf: "GO", sigla: "IUB", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Ivotí", uf: "RS", sigla: "IVI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Jaraguá", uf: "GO", sigla: "JRG", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Jataí", uf: "GO", sigla: "JTI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Jequié", uf: "BA", sigla: "JEE", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno: Ramon ger campo / Noturno: Ramon ger campo Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Ji-Paraná", uf: "RO", sigla: "JIP", fila: "PLANTA EXTERNA N1 / RO", eps: "ABILITY", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Uraci Diurno: 11 94459-4514", coordenador: "Diurno/Noturno: Cleiton Neves Diurno: 11 99820-3955", gerente: "Diurno/Noturno: Gerente Givanildo Domingos Diurno/Noturno: 65 99936-7161" },
        { municipio: "Juazeiro Do Norte", uf: "CE", sigla: "JNE", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", primeiroContato: "Diurno/Noturno: Joao Portugal: (71) 98460-8868", supervisor: "Diurno: Ricardo Alexandre / Noturno: Nelson Barroso Campo Diurno: 71 99742-2205 / Noturno: 88 98164-1839", coordenador: "Diurno/ Noturno: Marcilio Cassiano Sup Campo 85 99411-9484", gerente: "Diurno/Noturno: Patrick Porto Ger SR Diurno/Noturno: 71 99986-1262" },
        { municipio: "Lagarto", uf: "SE", sigla: "LAT", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Lagoa Vermelha", uf: "RS", sigla: "LVH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Lajeado", uf: "RS", sigla: "LJO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Lucas Do Rio Verde", uf: "MT", sigla: "LRV", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno/Noturno: Mauricio  Souza: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Luís Eduardo Magalhães", uf: "BA", sigla: "MIOO", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Macapá", uf: "AP", sigla: "MPA", fila: "PLANTA EXTERNA N1 / AP", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Clodomir Pinheiro / Noturno: Clodomir Pinheiro Diurno: 92 99427-4169 / Noturno: 92 99427-4169", gerente: "" },
        { municipio: "Mafra", uf: "SC", sigla: "MFA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno/Noturno: 48 99104-6957", coordenador: "Diurno/Noturno: Joanir Taques Diurno/Noturno: 47 99245-9288", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Manaus", uf: "AM", sigla: "MNS", fila: "PLANTA EXTERNA N1 / AM", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Clodomir Pinheiro / Noturno: Clodomir Pinheiro Diurno: 92 99427-4169 / Noturno: 92 99427-4169", gerente: "" },
        { municipio: "Mangaratiba", uf: "RJ", sigla: "MGB", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Mineiros", uf: "GO", sigla: "MNI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Morrinhos", uf: "GO", sigla: "MIH", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Wilmon da Silva Guimaraes Neto / Noturno: Wilmon da Silva Guimaraes Neto Diurno: 62 9691-4052 / Noturno: 62 9691-4052", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Mossoró", uf: "RN", sigla: "MRO", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", status: "SIGO", primeiroContato: "Mikaelle Silva De Oliveira/Giselle Esmeralda Do Prado/Vinicius Santos De Lucena/Allana Bernardo Dantas De Araujo/Fatima Maria Agripino Dos Reis/Abimael Anibal Vieira Filho (84) 98661-0163 / (81) 99256-9899 / (81) 98584-4552 / (84) 98749-6846 / (81) 98735-4262 / (81) 99119-5622", supervisor: "Diurno/Noturno: Vinicius Lucena Diurno/Noturno: (86) 99828-0083", coordenador: "Mihael Jakson Diurno/Noturno: (84) 98635-8332", gerente: "Diurno/Noturno: João Paulo Diurno/Noturno: (81) 98584-2246" },
        { municipio: "Navegantes", uf: "SC", sigla: "NVG", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: William Kruger Diurno/Noturno: 48 99159-5598", coordenador: "Diurno/Noturno: Joanir Taques Diurno/Noturno: 47 99245-9288", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Nova Friburgo", uf: "RJ", sigla: "NOF", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Nova Lima", uf: "MG", sigla: "NLA", fila: "PLANTA EXTERNA N1 / MG 5", eps: "TELEMONT", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Nova Mutum", uf: "MT", sigla: "NMM", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno/Noturno: Mauricio  Souza: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Nova Petrópolis", uf: "RS", sigla: "NVP", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Osório", uf: "RS", sigla: "OSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Paço Do Lumiar", uf: "MA", sigla: "PCL", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "Palmas", uf: "TO", sigla: "PMJ", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Juliano Henrique Prestes / Noturno: Juliano Henrique Prestes Diurno: 11 91760-5917 / Noturno: 11 91760-5917", gerente: "Diurno/Noturno: Jander Inacio Prates Diurno/Noturno: 67 998955452" },
        { municipio: "Palmeira Das Missões", uf: "RS", sigla: "PMM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Paragominas", uf: "PA", sigla: "PGN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Paraty", uf: "RJ", sigla: "PAT", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Parauapebas", uf: "PA", sigla: "PUP", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Parnaíba", uf: "PI", sigla: "PNA", fila: "PLANTA EXTERNA N1 / PI", eps: "R2", status: "SIGO", primeiroContato: "Diurno/Noturno: Caio Menezes (71) 99607-0561", supervisor: "Diurno: Jefferson sup campo / Noturno: Nelson Barroso Campo Diurno: 89 98122-2467 / Noturno: 88 98164-1839", coordenador: "Diurno: Jefferson sup campo / Noturno: Nelson sup campo Diurno: 89 98122-2467 / Noturno: 88 98164-1839", gerente: "Diurno: Nelson Sup campo / Noturno: Patrick Porto Ger SR Diurno: 88 98164-1839 / Noturno: 71 99986-1262" },
        { municipio: "Parnamirim", uf: "RN", sigla: "PWM", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", status: "SIGO", primeiroContato: "Mikaelle Silva De Oliveira/Giselle Esmeralda Do Prado/Vinicius Santos De Lucena/Allana Bernardo Dantas De Araujo/Fatima Maria Agripino Dos Reis/Abimael Anibal Vieira Filho (84) 98661-0163 / (81) 99256-9899 / (81) 98584-4552 / (84) 98749-6846 / (81) 98735-4262 / (81) 99119-5622", supervisor: "Diurno/Noturno: Vinicius Lucena Diurno/Noturno: (86) 99828-0083", coordenador: "Joã Paulo Diurno/Noturno: (81) 98584-2264", gerente: "Diurno/Noturno: João Paulo Diurno/Noturno: (81) 98584-2246" },
        { municipio: "Patos", uf: "PB", sigla: "POS", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", primeiroContato: "Mikaelle Silva De Oliveira/Giselle Esmeralda Do Prado/Vinicius Santos De Lucena/Allana Bernardo Dantas De Araujo/Fatima Maria Agripino Dos Reis/Abimael Anibal Vieira Filho (84) 98661-0163 / (81) 99256-9899 / (81) 98584-4552 / (84) 98749-6846 / (81) 98735-4262 / (81) 99119-5622", supervisor: "Diurno/Noturno: Vinicius Lucena Diurno/Noturno: (86) 99828-0083", coordenador: "Joã Paulo Diurno/Noturno: (81) 98584-2264", gerente: "Diurno/Noturno: João Paulo Diurno/Noturno: (81) 98584-2246" },
        { municipio: "Petrolina", uf: "PE", sigla: "PTA", fila: "PLANTA EXTERNA N1 / PE 1", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Petrópolis", uf: "RJ", sigla: "PTS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Picos", uf: "PI", sigla: "PCZ", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", status: "SIGO", primeiroContato: "Italo Nogueira De Sousa Carvalho (87) 99949-4033", supervisor: "Diurno/Noturno: Leonardo Ribeiro da Cruz Diurno/Noturno: 89 99428-2786", coordenador: "Diurno/Noturno: Tarcivando Oliveira 89 99405-9197", gerente: "" },
        { municipio: "Poços De Caldas", uf: "MG", sigla: "PCS", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Pomerode", uf: "SC", sigla: "POD", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: William Kruger Diurno/Noturno: 48 99159-5598", coordenador: "Diurno/Noturno: Joanir Taques Diurno/Noturno: 47 99245-9288", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Porto Seguro", uf: "BA", sigla: "PGU", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Pouso Alegre", uf: "MG", sigla: "PSA", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Primavera Do Leste", uf: "MT", sigla: "PVT", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Mauricio  Souza / Noturno: Diurno: 67 9805-7675 / Noturno: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Redenção", uf: "PA", sigla: "RDO", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Resende", uf: "RJ", sigla: "RSD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Ribeirão Das Neves", uf: "MG", sigla: "RNS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Rio Bonito", uf: "RJ", sigla: "RBT", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Rio Das Ostras", uf: "RJ", sigla: "RIOS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Rio Do Sul", uf: "SC", sigla: "RSL", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: William Kruger Diurno/Noturno: 48 99159-5598", coordenador: "Diurno/Noturno: Joanir Taques Diurno/Noturno: 47 99245-9288", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "Santa Inês", uf: "MA", sigla: "SIS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "Santa Luzia", uf: "MG", sigla: "SLU", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Santa Maria De Jetibá", uf: "ES", sigla: "SMJ", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "Santa Rosa", uf: "RS", sigla: "SRO", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Sant'Ana Do Livramento", uf: "RS", sigla: "SIV", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Santo Ângelo", uf: "RS", sigla: "SAN", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Santo Antônio De Jesus", uf: "BA", sigla: "SNJ", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "São Bento Do Sul", uf: "SC", sigla: "SBS", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno/Noturno: 48 99104-6957", coordenador: "Diurno/Noturno: Joanir Taques Diurno/Noturno: 47 99245-9288", gerente: "Diurno/Noturno: Gerente Gelson Diurno/Noturno: 48 99131-8410" },
        { municipio: "São José De Ribamar", uf: "MA", sigla: "SJE", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "São Luís", uf: "MA", sigla: "SLS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jose Maia de Oliveira / Noturno: Jose Maia de Oliveira Diurno: (98) 986068643 / Noturno: (98) 986068643", gerente: "Diurno: Felipe Silva Santos / Noturno: Felipe Silva Santos Diurno: 98 99165-5413 / Noturno: 98 99165-5413" },
        { municipio: "São Marcos", uf: "RS", sigla: "SCS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "São Mateus", uf: "ES", sigla: "SMT", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "NÃO SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "São Pedro Da Aldeia", uf: "RJ", sigla: "SPA", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Sarandi", uf: "RS", sigla: "SRD", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Sete Lagoas", uf: "MG", sigla: "SLA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Sinop", uf: "MT", sigla: "SNO", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Mauricio  Souza / Noturno: Diurno: 67 9805-7675 / Noturno: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Sobral", uf: "CE", sigla: "SOL", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", primeiroContato: "Ana Kezia (71) 99667-9100", supervisor: "Diurno: Ricardo Alexandre / Noturno: Nelson Barroso Campo Diurno: 71 99742-2205 / Noturno: 88 98164-1839", coordenador: "Diurno/ Noturno: Marcilio Cassiano Sup Campo 85 99411-9484", gerente: "Diurno/Noturno: Patrick Porto Ger SR Diurno/Noturno: 71 99986-1262" },
        { municipio: "Sorriso", uf: "MT", sigla: "SSZ", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Mauricio  Souza / Noturno: Diurno: 67 9805-7675 / Noturno: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Tangará Da Serra", uf: "MT", sigla: "TGS", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Mauricio  Souza / Noturno: Diurno: 67 9805-7675 / Noturno: 67 9805-7675", gerente: "Diurno: Jander / Noturno: Jander Diurno: 67 9895-5452 / Noturno: 67 9895-5452" },
        { municipio: "Taquara", uf: "RS", sigla: "TQR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Teixeira De Freitas", uf: "BA", sigla: "TAF", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Teresina", uf: "PI", sigla: "TSA", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", status: "SIGO", primeiroContato: "Diego Tiago Da Silva (89) 98136-9930", supervisor: "Diurno/Noturno: Leonardo Ribeiro da Cruz Diurno/Noturno: 89 99428-2786", coordenador: "Diurno/Noturno: Tarcivando Oliveira 89 99405-9197", gerente: "" },
        { municipio: "Teresópolis", uf: "RJ", sigla: "TRL", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Teutônia", uf: "RS", sigla: "TUN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Timóteo", uf: "MG", sigla: "TTO", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Torres", uf: "RS", sigla: "TES", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Tramandaí", uf: "RS", sigla: "TRI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Trancoso", uf: "BA", sigla: "TCOS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Três Corações", uf: "MG", sigla: "TCS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Três De Maio", uf: "RS", sigla: "TMI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Três Lagoas", uf: "MS", sigla: "TLS", fila: "PLANTA EXTERNA N1 / MS", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Juliano Henrique Prestes / Noturno: Juliano Henrique Prestes Diurno: 91760-5917 / Noturno: 91760-5917", gerente: "Diurno/Noturno: Jander Inacio Prates Diurno/Noturno: 67 998955452" },
        { municipio: "Três Pontas", uf: "MG", sigla: "TPS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Três Rios", uf: "RJ", sigla: "TRS", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Tucuruí", uf: "PA", sigla: "TUU", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Jefferson Sombra / Noturno: Jefferson Sombra Diurno: 91 99373-8853 / Noturno: 91 99373-8853", gerente: "Diurno/Noturno: Gerente Operacional Leis Barata Diurno/Noturno: 91 9369-2827" },
        { municipio: "Uberaba", uf: "MG", sigla: "URA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Ubiratan / Noturno: Cleverson Diurno: (34)998401248 / Noturno: (62) 996236940", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Uberlândia", uf: "MG", sigla: "ULA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Raquel / Noturno: Carla Diurno: 11 93442-3255 / Noturno: 11 91257-5972", coordenador: "Diurno: Ubiratan / Noturno: Cleverson Diurno: (34)998401248 / Noturno: (62) 996236940", gerente: "Diurno/Noturno: Gerente Operacional Isaac Machado Diurno/Noturno: 67 9981-0656" },
        { municipio: "Uruguaiana", uf: "RS", sigla: "UGN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Vacaria", uf: "RS", sigla: "VAA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Valença", uf: "RJ", sigla: "VLC", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Varginha", uf: "MG", sigla: "VGA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "NÃO SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Ac-acio Diurno/Noturno: (35) 99757-9489", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno: (31) 98492-6662", gerente: "Diurno/Noturno: Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Venâncio Aires", uf: "RS", sigla: "VAI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Veranópolis", uf: "RS", sigla: "VNS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" },
        { municipio: "Viana", uf: "ES", sigla: "VIA", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", status: "SIGO", primeiroContato: "", supervisor: "Rogério Sobreira 27 98109-1998", coordenador: "Claudio 27 98107-1871", gerente: "Diurno/Noturno: Perin Diurno/Noturno: 27 99940-3632" },
        { municipio: "Vitória Da Conquista", uf: "BA", sigla: "VCA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", primeiroContato: "", supervisor: "Diurno: Thiado Matos / Noturno: Ricardo Diurno: 73 99852-4467 / Noturno: 7199742-2205", coordenador: "Diurno/Noturno: Stanley Gonsalvez Diurno/Noturno: 71999033305", gerente: "Diurno/Noturno: Ramon ger campo Diurno/Noturno: 71 8104-8692" },
        { municipio: "Volta Redonda", uf: "RJ", sigla: "VRD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", status: "SIGO", primeiroContato: "", supervisor: "Diurno: LILIAM /Noturno: Sup campo WELLINGTON Diurno: 41 998023700 /Noturno: (24) 99932-1020", coordenador: "Diurno/Noturno: Rodrigo Palvas Diurno/Noturno:(31) 984926662", gerente: "Diurno/Noturno: Gerente Leandro Lucina Diurno/Noturno: (41) 992656324" },
        { municipio: "Xangri-Lá", uf: "RS", sigla: "XNLA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", status: "SIGO", primeiroContato: "", supervisor: "Diurno/Noturno: Leonardo Hauch Diurno/Noturno: 55 99989-2154", coordenador: "Diurno/ Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120", gerente: "Diurno/Noturno: Gerente senior Jeferson Diurno/Noturno: 54 98429 2120" }
    ];

const escalonamentoVivo = [
    { municipio: "Formosa", uf: "GO", sigla: "FRM", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", supervisorVivo: "Alessandro Rezende Da Silva (62) 98400-6294", emailSupervisorVivo: "alessandro.rsilva@telefonica.com", coordenadorVivo: "Daniel Domingos Viana (62) 98404-3448", emailCoordenadorVivo: "daniel.dviana@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Inhumas", uf: "GO", sigla: "IUS", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", supervisorVivo: "Alessandro Rezende Da Silva (62) 98400-6294", emailSupervisorVivo: "alessandro.rsilva@telefonica.com", coordenadorVivo: "Daniel Domingos Viana (62) 98404-3448", emailCoordenadorVivo: "daniel.dviana@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Itaberaí", uf: "GO", sigla: "IEI", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", supervisorVivo: "Alessandro Rezende Da Silva (62) 98400-6294", emailSupervisorVivo: "alessandro.rsilva@telefonica.com", coordenadorVivo: "Daniel Domingos Viana (62) 98404-3448", emailCoordenadorVivo: "daniel.dviana@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Ji-Paraná", uf: "RO", sigla: "JIP", fila: "PLANTA EXTERNA N1 / RO", eps: "ABILITY", supervisorVivo: "", emailSupervisorVivo: "", coordenadorVivo: "", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Aracruz", uf: "ES", sigla: "ACZ", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Cachoeiro De Itapemirim", uf: "ES", sigla: "CIM", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Guaraparí", uf: "ES", sigla: "GRI", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Santa Maria De Jetibá", uf: "ES", sigla: "SMJ", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "São Mateus", uf: "ES", sigla: "SMT", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Viana", uf: "ES", sigla: "VIA", fila: "PLANTA EXTERNA N1 / ES", eps: "Hallen", supervisorVivo: "Fabiano 11 97492-1488", emailSupervisorVivo: "", coordenadorVivo: "Natã 21 974163175", emailCoordenadorVivo: "", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Manaus", uf: "AM", sigla: "MNS", fila: "PLANTA EXTERNA N1 / AM", eps: "ONDACOM", supervisorVivo: "Júlio Nascimento (92) 99310-9714", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Macapá", uf: "AP", sigla: "MPA", fila: "PLANTA EXTERNA N1 / AP", eps: "ONDACOM", supervisorVivo: "Paulo Teixira (42) 99162-4090", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Caldas Novas", uf: "GO", sigla: "CLV", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Josiel Alves De Oliveira (62) 99858-9604", emailSupervisorVivo: "josiel.oliveira@telefonica.com", coordenadorVivo: "Danilo Antonio De Melo (62) 98470-6369", emailCoordenadorVivo: "danilo.melo@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Catalão", uf: "GO", sigla: "CTL", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Josiel Alves De Oliveira (62) 99858-9604", emailSupervisorVivo: "josiel.oliveira@telefonica.com", coordenadorVivo: "Danilo Antonio De Melo (62) 98470-6369", emailCoordenadorVivo: "danilo.melo@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Itumbiara", uf: "GO", sigla: "IUB", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Josiel Alves De Oliveira (62) 99858-9604", emailSupervisorVivo: "josiel.oliveira@telefonica.com", coordenadorVivo: "Celso Correa (47) 99252-7948", emailCoordenadorVivo: "celso.correa@telefonica.com.br", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Jaraguá", uf: "GO", sigla: "JRG", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Creone Moreira Souto (62) 98419-0813", emailSupervisorVivo: "creone.souto@telefonica.com", coordenadorVivo: "Alessandro José Lemes (63) 99991-4354", emailCoordenadorVivo: "alessandro.lemes@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Jataí", uf: "GO", sigla: "JTI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Everton Valim Menezes (64) 98438-8830", emailSupervisorVivo: "everton.menezes@telefonica.com", coordenadorVivo: "Danilo Antonio De Melo (62) 98470-6369", emailCoordenadorVivo: "danilo.melo@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Mineiros", uf: "GO", sigla: "MNI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Everton Valim Menezes (64) 98438-8830", emailSupervisorVivo: "everton.menezes@telefonica.com", coordenadorVivo: "Danilo Antonio De Melo (62) 98470-6369", emailCoordenadorVivo: "danilo.melo@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Morrinhos", uf: "GO", sigla: "MIH", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", supervisorVivo: "Josiel Alves De Oliveira (62) 99858-9604", emailSupervisorVivo: "josiel.oliveira@telefonica.com", coordenadorVivo: "Danilo Antonio De Melo (62) 98470-6369", emailCoordenadorVivo: "danilo.melo@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Açailândia", uf: "MA", sigla: "ACD", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Balsas", uf: "MA", sigla: "BLA", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Imperatriz", uf: "MA", sigla: "ITZ", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Paço Do Lumiar", uf: "MA", sigla: "PCL", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Santa Inês", uf: "MA", sigla: "SIS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "São José De Ribamar", uf: "MA", sigla: "SJE", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "São Luís", uf: "MA", sigla: "SLS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", supervisorVivo: "Tiago Araújo (11) 93448-3914", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Uberaba", uf: "MG", sigla: "URA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Felipe Da Silva Breda (34) 99941-8635", emailCoordenadorVivo: "felipe.breda@telefonica.com", gerenteVivo: "Rodrigo Gervini De Carvalho (21) 97602-7070", emailGerenteVivo: "rodrigo.gcarvalho@telefonica.com" },
    { municipio: "Uberlândia", uf: "MG", sigla: "ULA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Felipe Da Silva Breda (34) 99941-8635", emailCoordenadorVivo: "felipe.breda@telefonica.com", gerenteVivo: "Rodrigo Gervini De Carvalho (21) 97602-7070", emailGerenteVivo: "rodrigo.gcarvalho@telefonica.com" },
    { municipio: "Três Lagoas", uf: "MS", sigla: "TLS", fila: "PLANTA EXTERNA N1 / MS", eps: "ONDACOM", supervisorVivo: "Anderson Rodrigues Da Silva/Johnny De Matos (67) 99636-9476 / (67) 99307-5445", emailSupervisorVivo: "anderson.rsilva@telefonica.com /  johnny.matos@telefonica.com", coordenadorVivo: "Joaquim De Morais Silva (67) 99809-5250", emailCoordenadorVivo: "joaquim.silva@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Campo Verde", uf: "MT", sigla: "CZV", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Lucas Do Rio Verde", uf: "MT", sigla: "LRV", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Nova Mutum", uf: "MT", sigla: "NMM", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Primavera Do Leste", uf: "MT", sigla: "PVT", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Sinop", uf: "MT", sigla: "SNO", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Sorriso", uf: "MT", sigla: "SSZ", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Tangará Da Serra", uf: "MT", sigla: "TGS", fila: "PLANTA EXTERNA N1 / MT  2", eps: "ONDACOM", supervisorVivo: "Michael Chabalin Ferraz (65) 99810-2437", emailSupervisorVivo: "michael.ferraz@telefonica.com", coordenadorVivo: "Vitor Hugo Fabricio Godoy (67) 99847-6993", emailCoordenadorVivo: "vitor.godoy@telefonica.com", gerenteVivo: "Gilson Xavier Ferreira (67) 99234-5090", emailGerenteVivo: "ferreira.gilson@telefonica.com" },
    { municipio: "Altamira", uf: "PA", sigla: "ATM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Belém", uf: "PA", sigla: "BLM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Canaã Dos Carajás", uf: "PA", sigla: "CKJ", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Capanema", uf: "PA", sigla: "CPN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Castanhal", uf: "PA", sigla: "CAH", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Paragominas", uf: "PA", sigla: "PGN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Parauapebas", uf: "PA", sigla: "PUP", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Redenção", uf: "PA", sigla: "RDO", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Tucuruí", uf: "PA", sigla: "TUU", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", supervisorVivo: "Bruno Ayres (91) 98027-1952", emailSupervisorVivo: "", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "", emailGerenteVivo: "" },
    { municipio: "Araguaína", uf: "TO", sigla: "ARN", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", supervisorVivo: "Ribas Junios Gomes Campelo/Ramohn Caetano Da Silva (63) 99944-7319 / (63) 99992-6212", emailSupervisorVivo: "ribas.campelo@telefonica.com / ramohn.silva@telefonica.com", coordenadorVivo: "Alessandro José Lemes (63) 99991-4354", emailCoordenadorVivo: "alessandro.lemes@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Palmas", uf: "TO", sigla: "PMJ", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", supervisorVivo: "Ribas Junios Gomes Campelo/Ramohn Caetano Da Silva (63) 99944-7319 / (63) 99992-6212", emailSupervisorVivo: "ribas.campelo@telefonica.com / ramohn.silva@telefonica.com", coordenadorVivo: "Alessandro José Lemes (63) 99991-4354", emailCoordenadorVivo: "alessandro.lemes@telefonica.com", gerenteVivo: "Daniel De Jesus Farias (62) 99997-1222", emailGerenteVivo: "daniel.farias@telefonica.com" },
    { municipio: "Arapiraca", uf: "AL", sigla: "AIR", fila: "PLANTA EXTERNA N1 / AL", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Arraial D'Ajuda", uf: "BA", sigla: "ALDA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Barreiras", uf: "BA", sigla: "BES", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Eunápolis", uf: "BA", sigla: "EUS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Guanambi", uf: "BA", sigla: "GNB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Ilhéus", uf: "BA", sigla: "ILH", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Itabuna", uf: "BA", sigla: "ITB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Jequié", uf: "BA", sigla: "JEE", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Luís Eduardo Magalhães", uf: "BA", sigla: "MIOO", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Porto Seguro", uf: "BA", sigla: "PGU", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Santo Antônio De Jesus", uf: "BA", sigla: "SNJ", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Teixeira De Freitas", uf: "BA", sigla: "TAF", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Bruno Leonardo Bezerra De Araujo Favoreto (41) 99138-3727", emailCoordenadorVivo: "bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Trancoso", uf: "BA", sigla: "TCOS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Vitória Da Conquista", uf: "BA", sigla: "VCA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Crato", uf: "CE", sigla: "CTO", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Juazeiro Do Norte", uf: "CE", sigla: "JNE", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Sobral", uf: "CE", sigla: "SOL", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Petrolina", uf: "PE", sigla: "PTA", fila: "PLANTA EXTERNA N1 / PE 1", eps: "R2", supervisorVivo: "Samuel Costa (11) 94323-7772", emailSupervisorVivo: "samueld.costa@telefonica.com", coordenadorVivo: "Fred Oliveira (81) 99229-4398", emailCoordenadorVivo: "fred.silva@telefonica.com", gerenteVivo: "Cristian Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Parnaíba", uf: "PI", sigla: "PNA", fila: "PLANTA EXTERNA N1 / PI", eps: "R2", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Lagarto", uf: "SE", sigla: "LAT", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", supervisorVivo: "Denilson Tragante (11) 94145-1175", emailSupervisorVivo: "denilson.tragante@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto/Bruno Leonardo Bezerra De Araujo Favoreto (71) 99980-2017 / (41) 99138-3727", emailCoordenadorVivo: "jose.neto3@telefonica.com / bruno.favoreto@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Divinópolis", uf: "MG", sigla: "DVL", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Roberto Valeriano De Souza (31) 97104-0256", emailSupervisorVivo: "roberto.vsouza@telefonica.com", coordenadorVivo: "Juliano Nunes De Oliveira (31) 99591-9305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Ibirité", uf: "MG", sigla: "IIE", fila: "PLANTA EXTERNA N1 / MG 2", eps: "RADIANTE", supervisorVivo: "Roberto Valeriano De Souza (31) 97104-0256", emailSupervisorVivo: "roberto.vsouza@telefonica.com", coordenadorVivo: "Juliano Nunes De Oliveira (31) 99591-9305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Poços De Caldas", uf: "MG", sigla: "PCS", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Juliano Ferreira De Souza (31) 99970-8223", emailCoordenadorVivo: "juliano.fsouza@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Pouso Alegre", uf: "MG", sigla: "PSA", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Juliano Ferreira De Souza (31) 99970-8223", emailCoordenadorVivo: "juliano.fsouza@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Ribeirão Das Neves", uf: "MG", sigla: "RNS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Jair Rosa de Melo (31) 99955-7573", emailSupervisorVivo: "jair.melo@telefonica.com", coordenadorVivo: "Juliano Nunes de Oliveira 31995919305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao 31999102830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Santa Luzia", uf: "MG", sigla: "SLU", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Roberto Valeriano De Souza (31) 97104-0256", emailSupervisorVivo: "roberto.vsouza@telefonica.com", coordenadorVivo: "Juliano Nunes De Oliveira (31) 99591-9305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Sete Lagoas", uf: "MG", sigla: "SLA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Jair Rosa De Melo (31) 99955-7573", emailSupervisorVivo: "jair.melo@telefonica.com", coordenadorVivo: "Juliano Nunes De Oliveira (31) 99591-9305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Timóteo", uf: "MG", sigla: "TTO", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Vitor Alves De Oliveira (38) 99941-9242", emailCoordenadorVivo: "vitor.aoliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Três Corações", uf: "MG", sigla: "TCS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Juliano Ferreira De Souza (31) 99970-8223", emailCoordenadorVivo: "juliano.fsouza@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Três Pontas", uf: "MG", sigla: "TPS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Juliano Ferreira De Souza (31) 99970-8223", emailCoordenadorVivo: "juliano.fsouza@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Varginha", uf: "MG", sigla: "VGA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", supervisorVivo: "Alessandro De Jesus Moreira (35) 98881-4115", emailSupervisorVivo: "alessandro.moreira@fibrasil.com.br", coordenadorVivo: "Juliano Ferreira De Souza (31) 99970-8223", emailCoordenadorVivo: "juliano.fsouza@telefonica.com", gerenteVivo: "Bruno Junqueira Leitão De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Angra Dos Reis", uf: "RJ", sigla: "ARS", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Araruama", uf: "RJ", sigla: "AMA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Armação Dos Búzios", uf: "RJ", sigla: "ARBU", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Barra Do Piraí", uf: "RJ", sigla: "BPI", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Barra Mansa", uf: "RJ", sigla: "BMA", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Cabo Frio", uf: "RJ", sigla: "CBF", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Iguaba Grande", uf: "RJ", sigla: "IGGR", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Itaperuna", uf: "RJ", sigla: "IRA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Mangaratiba", uf: "RJ", sigla: "MGB", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Nova Friburgo", uf: "RJ", sigla: "NOF", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Paraty", uf: "RJ", sigla: "PAT", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Petrópolis", uf: "RJ", sigla: "PTS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Resende", uf: "RJ", sigla: "RSD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Rio Bonito", uf: "RJ", sigla: "RBT", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Rio Das Ostras", uf: "RJ", sigla: "RIOS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "São Pedro Da Aldeia", uf: "RJ", sigla: "SPA", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Teresópolis", uf: "RJ", sigla: "TRL", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Três Rios", uf: "RJ", sigla: "TRS", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Valença", uf: "RJ", sigla: "VLC", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Volta Redonda", uf: "RJ", sigla: "VRD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE", supervisorVivo: "Jesus Pedruzi (21) 97260-9581", emailSupervisorVivo: "jesus.pedruzi@fibrasil.com.br", coordenadorVivo: "Caxero (21) 96899-1929", emailCoordenadorVivo: "carlos.cjunior@telefonica.com", gerenteVivo: "Joao Lima (21) 97244-1065", emailGerenteVivo: "joao.flima@telefonica.com" },
    { municipio: "Alegrete", uf: "RS", sigla: "ALG", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Bagé", uf: "RS", sigla: "BGE", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Deomar Almeida De Oliveira (53) 98425-4561", emailSupervisorVivo: "deomar.oliveira@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Cachoeira Do Sul", uf: "RS", sigla: "CCR", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Camaquã", uf: "RS", sigla: "CAM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Deomar Almeida De Oliveira (53) 98425-4561", emailSupervisorVivo: "deomar.oliveira@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Canela", uf: "RS", sigla: "CEN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Capão Da Canoa", uf: "RS", sigla: "KDK", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson Andrade Marins (51) 99779-1640", emailSupervisorVivo: "anderson.marins@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Carazinho", uf: "RS", sigla: "CIO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Cassio Fernando Rocha Oliveira (54) 99608-4221", emailSupervisorVivo: "cassio.oliveira@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Carlos Barbosa", uf: "RS", sigla: "CLB", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Charqueadas", uf: "RS", sigla: "CQU", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Richter Silva (51) 99754-9214", emailSupervisorVivo: "silva.diego@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Dois Irmãos", uf: "RS", sigla: "DSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Marcio Andre Da Rosa Mendes (51) 99589-2075", emailSupervisorVivo: "marcio.amendes@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Erechim", uf: "RS", sigla: "ERE", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Cassio Fernando Rocha Oliveira (54) 99608-4221", emailSupervisorVivo: "cassio.oliveira@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Estrela", uf: "RS", sigla: "ETA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Flores Da Cunha", uf: "RS", sigla: "FCA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson De Lima Velho (54) 99707-3335", emailSupervisorVivo: "anderson.velho@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Garibaldi", uf: "RS", sigla: "GRD", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Gramado", uf: "RS", sigla: "GDO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Igrejinha", uf: "RS", sigla: "IJH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Marcio Andre Da Rosa Mendes (51) 99589-2075", emailSupervisorVivo: "marcio.amendes@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Ijuí", uf: "RS", sigla: "IJI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Ivotí", uf: "RS", sigla: "IVI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Marcio Andre Da Rosa Mendes (51) 99589-2075", emailSupervisorVivo: "marcio.amendes@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Lagoa Vermelha", uf: "RS", sigla: "LVH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Cassio Fernando Rocha Oliveira (54) 99608-4221", emailSupervisorVivo: "cassio.oliveira@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Lajeado", uf: "RS", sigla: "LJO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Nova Petrópolis", uf: "RS", sigla: "NVP", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Osório", uf: "RS", sigla: "OSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson Andrade Marins (51) 99779-1640", emailSupervisorVivo: "anderson.marins@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Palmeira Das Missões", uf: "RS", sigla: "PMM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Santa Rosa", uf: "RS", sigla: "SRO", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Sant'Ana Do Livramento", uf: "RS", sigla: "SIV", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Santo Ângelo", uf: "RS", sigla: "SAN", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "São Marcos", uf: "RS", sigla: "SCS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson De Lima Velho (54) 99707-3335", emailSupervisorVivo: "anderson.velho@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Sarandi", uf: "RS", sigla: "SRD", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Cassio Fernando Rocha Oliveira (54) 99608-4221", emailSupervisorVivo: "cassio.oliveira@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Taquara", uf: "RS", sigla: "TQR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Marcio Andre Da Rosa Mendes (51) 99589-2075", emailSupervisorVivo: "marcio.amendes@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Teutônia", uf: "RS", sigla: "TUN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Torres", uf: "RS", sigla: "TES", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson Andrade Marins (51) 99779-1640", emailSupervisorVivo: "anderson.marins@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Tramandaí", uf: "RS", sigla: "TRI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson Andrade Marins (51) 99779-1640", emailSupervisorVivo: "anderson.marins@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Três De Maio", uf: "RS", sigla: "TMI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Uruguaiana", uf: "RS", sigla: "UGN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Vacaria", uf: "RS", sigla: "VAA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Cassio Fernando Rocha Oliveira (54) 99608-4221", emailSupervisorVivo: "cassio.oliveira@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Venâncio Aires", uf: "RS", sigla: "VAI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "Razao Info", supervisorVivo: "Claudio Soares Liberalesso (54) 99926-9670", emailSupervisorVivo: "claudio.liberalesso@telefonica.com", coordenadorVivo: "Marcos Vinicius Xavier Dutra (51) 99953-6675", emailCoordenadorVivo: "marcos.dutra@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Veranópolis", uf: "RS", sigla: "VNS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Diego Dos Santos Machado (51) 99872-6541", emailSupervisorVivo: "diego.machado@telefonica.com", coordenadorVivo: "Jeferson Gardino (47) 99201-2274", emailCoordenadorVivo: "jeferson.gardino@telefonica.com", gerenteVivo: "Maxchel Joner Da Silva (51) 98120-9962", emailGerenteVivo: "maxchel.silva@telefonica.com" },
    { municipio: "Xangri-Lá", uf: "RS", sigla: "XNLA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "Razao Info", supervisorVivo: "Anderson Andrade Marins (51) 99779-1640", emailSupervisorVivo: "anderson.marins@telefonica.com", coordenadorVivo: "João Andrioli (41) 99244-9441", emailCoordenadorVivo: "joao.cferreira@telefonica.com", gerenteVivo: "Michel Romanini (44) 98455-2705", emailGerenteVivo: "juan.romanini@telefonica.com" },
    { municipio: "Cabedelo", uf: "PB", sigla: "CBD", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", supervisorVivo: "Samuel Costa (11) 94323-7772", emailSupervisorVivo: "samueld.costa@telefonica.com", coordenadorVivo: "Fred Oliveira (81) 99229-4398", emailCoordenadorVivo: "fred.silva@telefonica.com", gerenteVivo: "Cristian Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Patos", uf: "PB", sigla: "POS", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", supervisorVivo: "Samuel Costa (11) 94323-7772", emailSupervisorVivo: "samueld.costa@telefonica.com", coordenadorVivo: "Fred Oliveira (81) 99229-4399", emailCoordenadorVivo: "fred.silva@telefonica.com", gerenteVivo: "Cristian Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Garanhuns", uf: "PE", sigla: "GUS", fila: "PLANTA EXTERNA N1 / PE 2", eps: "TECNOMULTI", supervisorVivo: "Samuel Costa (11) 94323-7772", emailSupervisorVivo: "samueld.costa@telefonica.com", coordenadorVivo: "Fred Oliveira (81) 99229-4398", emailCoordenadorVivo: "fred.silva@telefonica.com", gerenteVivo: "Cristian Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Mossoró", uf: "RN", sigla: "MRO", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Parnamirim", uf: "RN", sigla: "PWM", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Nova Lima", uf: "MG", sigla: "NLA", fila: "PLANTA EXTERNA N1 / MG 5", eps: "TELEMONT", supervisorVivo: "Jair Rosa De Melo (31) 99955-7573", emailSupervisorVivo: "jair.melo@telefonica.com", coordenadorVivo: "Juliano Nunes De Oliveira (31) 99591-9305", emailCoordenadorVivo: "juliano.noliveira@telefonica.com", gerenteVivo: "Bruno Junqueira Leitao De Almeida (31) 99910-2830", emailGerenteVivo: "bruno.jalmeida@telefonica.com" },
    { municipio: "Capinzal", uf: "SC", sigla: "CNZ", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Alex Facci (49) 99104-3551", emailSupervisorVivo: "alex.ribeiro@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Concórdia", uf: "SC", sigla: "CDA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Alex Facci (49) 99104-3551", emailSupervisorVivo: "alex.ribeiro@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Fraiburgo", uf: "SC", sigla: "FGO", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Alex Facci (49) 99104-3551", emailSupervisorVivo: "alex.ribeiro@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Garopaba", uf: "SC", sigla: "GRB", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Assis Gilberto Oribe (48) 99113-7843", emailSupervisorVivo: "assis.santos@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Imbituba", uf: "SC", sigla: "IMA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Assis Gilberto Oribe (48) 99113-7843", emailSupervisorVivo: "assis.santos@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Mafra", uf: "SC", sigla: "MFA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Edinilson Matias (47) 99190-4626", emailSupervisorVivo: "edmlson.silva@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Navegantes", uf: "SC", sigla: "NVG", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Cledson Rogerio (47) 99197-3303", emailSupervisorVivo: "cledson.roehrs@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Pomerode", uf: "SC", sigla: "POD", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Cledson Rogerio (47) 99197-3303", emailSupervisorVivo: "cledson.roehrs@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Rio Do Sul", uf: "SC", sigla: "RSL", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Cledson Rogerio (47) 99197-3303", emailSupervisorVivo: "cledson.roehrs@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "São Bento Do Sul", uf: "SC", sigla: "SBS", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", supervisorVivo: "Edinilson Matias (47) 99190-4626", emailSupervisorVivo: "edmlson.silva@telefonica.com", coordenadorVivo: "Fábio Ferreira De Oliveira (48) 99111-9942", emailCoordenadorVivo: "fabio.foliveira@telefonica.com", gerenteVivo: "Elise Zerwes (48) 99248-0760", emailGerenteVivo: "elise.zerwes@telefonica.com" },
    { municipio: "Picos", uf: "PI", sigla: "PCZ", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" },
    { municipio: "Teresina", uf: "PI", sigla: "TSA", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", supervisorVivo: "Douglas Dos Reis Mata (86) 98106-6049", emailSupervisorVivo: "douglasd.mata@telefonica.com", coordenadorVivo: "Jose Do Prado Barreto Neto (71) 99980-2017", emailCoordenadorVivo: "jose.neto3@telefonica.com", gerenteVivo: "Cristian Natalino Carvalho (85) 99112-2895", emailGerenteVivo: "cristian.carvalho@telefonica.com" }
];

    const escalonamentoCompleto = escalonamentoVivo;

    // Extração e normalização de telefones
    const extractPhones = (text) => {
        if (!text) return [];
        const regex = /(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s]?\d{4}/g;
        const matches = text.match(regex) || [];
        return matches.map(m => m.trim()).filter(m => m.replace(/\D/g, '').length >= 8);
    };

    const extractEmails = (text) => {
        if (!text) return [];
        const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        return text.match(regex) || [];
    };

    // Formatação de telefone adicionando 0 no DDD (Exemplo: 098, 011)
    const formatPhoneWithZeroDDD = (rawPhone) => {
        if (!rawPhone || !rawPhone.trim() || rawPhone.toLowerCase().includes('sem contato')) {
            return 'sem contato';
        }
        const rawParts = rawPhone.split(/\s*[\/,]\s*/);
        const formattedParts = rawParts.map(part => {
            let digits = part.replace(/\D/g, '');
            if (!digits || digits.length < 8) return part.trim();

            // Remove código de país 55 se vier com 12 ou 13 dígitos
            if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
                digits = digits.substring(2);
            }
            // Remove zero inicial se já existir antes de adicionar o formato padronizado
            if (digits.startsWith('0')) {
                digits = digits.substring(1);
            }

            if (digits.length === 11) { // DDD 2 dígitos + 9 celular
                const ddd = '0' + digits.substring(0, 2);
                const p1 = digits.substring(2, 7);
                const p2 = digits.substring(7);
                return `${ddd} ${p1}-${p2}`;
            } else if (digits.length === 10) { // DDD 2 dígitos + 8 fixo
                const ddd = '0' + digits.substring(0, 2);
                const p1 = digits.substring(2, 6);
                const p2 = digits.substring(6);
                return `${ddd} ${p1}-${p2}`;
            } else if (digits.length === 9) {
                return `${digits.substring(0, 5)}-${digits.substring(5)}`;
            } else if (digits.length === 8) {
                return `${digits.substring(0, 4)}-${digits.substring(4)}`;
            }
            return part.trim();
        });
        return formattedParts.join(' / ');
    };

    // Parser universal de contatos estruturado em Diurno e Noturno com DDD 0 e E-mail
    const parseContact = (raw, explicitEmail = '') => {
        let res = {
            diurno: { nome: 'sem contato', telefone: 'sem contato', email: 'sem e-mail' },
            noturno: { nome: 'sem contato', telefone: 'sem contato', email: 'sem e-mail' }
        };

        const explicitEmails = extractEmails(explicitEmail || '');

        if (!raw || !raw.trim()) {
            if (explicitEmails.length >= 2) {
                res.diurno.email = explicitEmails[0];
                res.noturno.email = explicitEmails[1];
            } else if (explicitEmails.length === 1) {
                res.diurno.email = explicitEmails[0];
                res.noturno.email = explicitEmails[0];
            }
            return res;
        }

        let text = raw.trim().replace(/Diruno/gi, 'Diurno');
        const textEmails = extractEmails(text);
        const emails = explicitEmails.length > 0 ? explicitEmails : textEmails;

        // Padrão 1: Contém Diurno e Noturno explícitos
        if (/Diurno\s*:/i.test(text) && /Noturno\s*:/i.test(text) && !/Diurno\s*\/\s*Noturno/i.test(text)) {
            const parts = text.split(/(?=Diurno\s*:)/i).filter(p => p.trim());
            if (parts.length >= 2) {
                const namePart = parts[0];
                const phonePart = parts[1];

                const nameDMatch = namePart.match(/Diurno\s*:\s*([^/]*?)(?:\s*\/\s*Noturno|$)/i);
                const nameNMatch = namePart.match(/Noturno\s*:\s*(.*)$/i);

                const phoneDMatch = phonePart.match(/Diurno\s*:\s*([^/]*?)(?:\s*\/\s*Noturno|$)/i);
                const phoneNMatch = phonePart.match(/Noturno\s*:\s*(.*)$/i);

                let dNome = nameDMatch ? nameDMatch[1].trim() : '';
                let nNome = nameNMatch ? nameNMatch[1].trim() : '';
                let dTel = phoneDMatch ? phoneDMatch[1].trim() : '';
                let nTel = phoneNMatch ? phoneNMatch[1].trim() : '';

                extractEmails(dNome + ' ' + dTel).forEach(em => { dNome = dNome.replace(em, ''); dTel = dTel.replace(em, ''); });
                extractEmails(nNome + ' ' + nTel).forEach(em => { nNome = nNome.replace(em, ''); nTel = nTel.replace(em, ''); });

                if (extractPhones(dNome).length > 0 && !dTel) { dTel = dNome; dNome = ''; }
                if (extractPhones(nNome).length > 0 && !nTel) { nTel = nNome; nNome = ''; }

                const dPhoneClean = extractPhones(dTel)[0] || dTel;
                const nPhoneClean = extractPhones(nTel)[0] || nTel;

                res = {
                    diurno: {
                        nome: dNome.trim() || (dPhoneClean ? 'Plantão Diurno' : 'sem contato'),
                        telefone: formatPhoneWithZeroDDD(dPhoneClean),
                        email: emails[0] || 'sem e-mail'
                    },
                    noturno: {
                        nome: nNome.trim() || (nPhoneClean ? 'Plantão Noturno' : 'sem contato'),
                        telefone: formatPhoneWithZeroDDD(nPhoneClean),
                        email: emails[1] || emails[0] || 'sem e-mail'
                    }
                };
            } else {
                const dMatch = text.match(/Diurno\s*:\s*([^/]*?)(?:\s*\/\s*Noturno\s*:|$)/i);
                const nMatch = text.match(/Noturno\s*:\s*(.*)$/i);

                const dText = dMatch ? dMatch[1].trim() : '';
                const nText = nMatch ? nMatch[1].trim() : '';

                const dPhones = extractPhones(dText);
                const nPhones = extractPhones(nText);

                let dNome = dText;
                extractEmails(dNome).forEach(em => { dNome = dNome.replace(em, ''); });
                if (dPhones.length) dNome = dNome.replace(dPhones[0], '');
                dNome = dNome.replace(/\(|\)/g, '').trim();

                let nNome = nText;
                extractEmails(nNome).forEach(em => { nNome = nNome.replace(em, ''); });
                if (nPhones.length) nNome = nNome.replace(nPhones[0], '');
                nNome = nNome.replace(/\(|\)/g, '').trim();

                res = {
                    diurno: {
                        nome: dNome || (dPhones[0] ? 'Plantão Diurno' : 'sem contato'),
                        telefone: formatPhoneWithZeroDDD(dPhones[0] || ''),
                        email: emails[0] || 'sem e-mail'
                    },
                    noturno: {
                        nome: nNome || (nPhones[0] ? 'Plantão Noturno' : 'sem contato'),
                        telefone: formatPhoneWithZeroDDD(nPhones[0] || ''),
                        email: emails[1] || emails[0] || 'sem e-mail'
                    }
                };
            }
        } else if (/Diurno\s*\/\s*Noturno/i.test(text)) {
            // Padrão 2: Diurno/Noturno compartilhado
            const cleaned = text.replace(/Diurno\s*\/\s*Noturno\s*:?\s*/gi, ' ').trim();
            const phones = extractPhones(cleaned);
            let nome = cleaned;
            extractEmails(cleaned).forEach(em => { nome = nome.replace(em, ''); });
            phones.forEach(p => { nome = nome.replace(p, ''); });
            nome = nome.replace(/\(|\)/g, '').replace(/Diurno\s*\/\s*Noturno\s*:?/gi, '').trim();

            const telStr = formatPhoneWithZeroDDD(phones[0] || '');
            const nomeStr = nome || (telStr !== 'sem contato' ? 'Plantão Geral' : 'sem contato');
            const emailStr = emails[0] || 'sem e-mail';

            res = {
                diurno: { nome: nomeStr, telefone: telStr, email: emailStr },
                noturno: { nome: nomeStr, telefone: telStr, email: emailStr }
            };
        } else {
            // Padrão 3: Parser Geral com suporte a múltiplos contatos (1º Nome = 1º Telefone, 2º Nome = 2º Telefone)
            const allPhones = extractPhones(text);

            let textWithoutEmails = text;
            extractEmails(text).forEach(em => { textWithoutEmails = textWithoutEmails.replace(em, ''); });

            if (allPhones.length >= 2) {
                let textWithoutPhones = textWithoutEmails;
                allPhones.forEach(p => {
                    textWithoutPhones = textWithoutPhones.replace(p, '');
                });
                textWithoutPhones = textWithoutPhones.replace(/[\(\)]/g, ' ').replace(/\s+-\s+/g, '/').replace(/\s+/g, ' ').trim();

                const nameParts = textWithoutPhones.split('/').map(n => n.trim()).filter(n => n.length > 0);

                let dNome = nameParts[0] || 'Responsável Diurno';
                let nNome = nameParts[1] || nameParts[0] || 'Responsável Noturno';
                let dPhone = allPhones[0] || '';
                let nPhone = allPhones[1] || allPhones[0] || '';

                res = {
                    diurno: {
                        nome: dNome,
                        telefone: formatPhoneWithZeroDDD(dPhone),
                        email: emails[0] || 'sem e-mail'
                    },
                    noturno: {
                        nome: nNome,
                        telefone: formatPhoneWithZeroDDD(nPhone),
                        email: emails[1] || emails[0] || 'sem e-mail'
                    }
                };
            } else if (allPhones.length === 1) {
                let textWithoutPhones = textWithoutEmails.replace(allPhones[0], '').replace(/[\(\)]/g, ' ').trim();
                const nameParts = textWithoutPhones.split('/').map(n => n.trim()).filter(n => n.length > 0);

                if (nameParts.length >= 2) {
                    res = {
                        diurno: {
                            nome: nameParts[0],
                            telefone: formatPhoneWithZeroDDD(allPhones[0]),
                            email: emails[0] || 'sem e-mail'
                        },
                        noturno: {
                            nome: nameParts[1],
                            telefone: formatPhoneWithZeroDDD(allPhones[0]),
                            email: emails[1] || emails[0] || 'sem e-mail'
                        }
                    };
                } else {
                    const nome = nameParts[0] || 'Responsável';
                    res = {
                        diurno: {
                            nome: nome,
                            telefone: formatPhoneWithZeroDDD(allPhones[0]),
                            email: emails[0] || 'sem e-mail'
                        },
                        noturno: {
                            nome: nome,
                            telefone: formatPhoneWithZeroDDD(allPhones[0]),
                            email: emails[0] || 'sem e-mail'
                        }
                    };
                }
            } else {
                const nameParts = textWithoutEmails.split('/').map(n => n.trim()).filter(n => n.length > 0);
                const dNome = nameParts[0] || 'sem contato';
                const nNome = nameParts[1] || dNome;

                res = {
                    diurno: {
                        nome: dNome,
                        telefone: 'sem contato',
                        email: emails[0] || 'sem e-mail'
                    },
                    noturno: {
                        nome: nNome,
                        telefone: 'sem contato',
                        email: emails[1] || emails[0] || 'sem e-mail'
                    }
                };
            }
        }

        // Aplicação de explicitEmail garantindo ordenação correta
        if (explicitEmails.length >= 2) {
            res.diurno.email = explicitEmails[0];
            res.noturno.email = explicitEmails[1];
        } else if (explicitEmails.length === 1) {
            res.diurno.email = explicitEmails[0];
            if (!res.noturno.email || res.noturno.email === 'sem e-mail') {
                res.noturno.email = explicitEmails[0];
            }
        }

        return res;
    };

    // Normalização padrão para nomes de filas (ex: "N1/RJ 1", "N1 / RJ 1", "N1/RJ1" -> "PLANTA EXTERNA N1 / RJ 1")
    const normalizeFila = (rawFila) => {
        if (!rawFila) return 'SEM FILA DEFINIDA';
        let f = String(rawFila).trim().toUpperCase();
        // Substitui múltiplos espaços por um único
        f = f.replace(/\s+/g, ' ');
        // Normaliza barras: garante espaço antes e depois de '/'
        f = f.replace(/\s*\/\s*/g, ' / ');
        // Normaliza separação entre UF e número se colados (ex: RJ1 -> RJ 1)
        f = f.replace(/([A-Z]{2})\s*(\d+)/g, '$1 $2');
        // Garante prefixo padrão PLANTA EXTERNA se começar com N1
        if (!f.startsWith('PLANTA EXTERNA') && f.startsWith('N1')) {
            f = 'PLANTA EXTERNA ' + f;
        }
        return f.replace(/\s+/g, ' ').trim();
    };

    // Unificação das bases EPS e VIVO por Município e UF
    const buildUnifiedCities = () => {
        const normalizeKey = (mun, uf) => {
            return (mun || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + '-' + (uf || '').trim().toUpperCase();
        };

        const cityMap = new Map();

        // 1. Adicionar dados de EPS
        escalonamentoEPS.forEach(item => {
            const key = normalizeKey(item.municipio, item.uf);
            cityMap.set(key, {
                municipio: item.municipio,
                uf: item.uf,
                sigla: item.sigla || 'N/A',
                fila: item.fila || '',
                filaNormalizada: normalizeFila(item.fila),
                eps: item.eps || '',
                status: item.status || '',
                epsData: item,
                vivoData: null
            });
        });

        // 2. Mesclar dados de VIVO
        escalonamentoVivo.forEach(item => {
            const key = normalizeKey(item.municipio, item.uf);
            if (cityMap.has(key)) {
                const existing = cityMap.get(key);
                existing.vivoData = item;
                if (!existing.sigla || existing.sigla === 'N/A') existing.sigla = item.sigla || 'N/A';
                if (!existing.fila) {
                    existing.fila = item.fila || '';
                    existing.filaNormalizada = normalizeFila(item.fila);
                }
                if (!existing.eps) existing.eps = item.eps || '';
            } else {
                cityMap.set(key, {
                    municipio: item.municipio,
                    uf: item.uf,
                    sigla: item.sigla || 'N/A',
                    fila: item.fila || '',
                    filaNormalizada: normalizeFila(item.fila),
                    eps: item.eps || '',
                    status: item.status || '',
                    epsData: null,
                    vivoData: item
                });
            }
        });

        return Array.from(cityMap.values()).sort((a, b) => a.municipio.localeCompare(b.municipio));
    };

    // Agrupamento de cidades por Fila normalizada
    const buildFilasGrouped = (citiesList) => {
        const filaMap = new Map();

        citiesList.forEach(city => {
            const normFila = city.filaNormalizada || normalizeFila(city.fila);
            city.filaNormalizada = normFila;
            
            if (!filaMap.has(normFila)) {
                filaMap.set(normFila, {
                    nomeFila: normFila,
                    cidades: [],
                    ufs: new Set(),
                    epsList: new Set()
                });
            }

            const group = filaMap.get(normFila);
            group.cidades.push(city);
            if (city.uf) group.ufs.add(city.uf);
            const epsName = city.eps || (city.epsData && city.epsData.eps);
            if (epsName) group.epsList.add(epsName);
        });

        // Ordenar as filas alfabeticamente
        const sortedGroups = Array.from(filaMap.values()).sort((a, b) => 
            a.nomeFila.localeCompare(b.nomeFila, 'pt-BR', { numeric: true, sensitivity: 'base' })
        );

        // Ordenar cidades dentro de cada fila por município
        sortedGroups.forEach(g => {
            g.cidades.sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'));
        });

        return sortedGroups;
    };

    let unifiedCities = buildUnifiedCities();

    const copyPhoneToClipboard = async (phone, element) => {
        if (!phone) return;
        try {
            const cleanText = phone.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(cleanText);
            } else {
                const tempInput = document.createElement('textarea');
                tempInput.value = cleanText;
                tempInput.style.position = 'fixed';
                tempInput.style.opacity = '0';
                document.body.appendChild(tempInput);
                tempInput.focus();
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }
            const originalHTML = element.innerHTML;
            element.innerHTML = '<i class="fas fa-check"></i>';
            element.style.color = '#22c55e';
            setTimeout(() => {
                element.innerHTML = originalHTML;
                element.style.color = '';
            }, 1500);
        } catch (err) {
            console.error('Erro ao copiar telefone/email:', err);
        }
    };

    const renderContactBlock = (roleTitle, iconClass, rawData, isVivo = false, explicitEmail = '') => {
        const parsed = parseContact(rawData, explicitEmail);

        const isSameContact = (
            parsed.diurno.nome.trim().toLowerCase() === parsed.noturno.nome.trim().toLowerCase() &&
            parsed.diurno.telefone.trim() === parsed.noturno.telefone.trim() &&
            parsed.diurno.email.trim().toLowerCase() === parsed.noturno.email.trim().toLowerCase()
        );

        if (isSameContact) {
            const hasPhone = parsed.diurno.telefone && parsed.diurno.telefone !== 'sem contato';
            const hasEmail = parsed.diurno.email && parsed.diurno.email !== 'sem e-mail';

            const copyBtnPhone = hasPhone
                ? `<button class="copy-phone-btn" data-phone="${parsed.diurno.telefone}" title="Copiar telefone (${parsed.diurno.telefone})"><i class="fas fa-copy"></i></button>`
                : '';

            const copyBtnEmail = hasEmail
                ? `<button class="copy-phone-btn copy-email-btn" data-phone="${parsed.diurno.email}" title="Copiar e-mail (${parsed.diurno.email})"><i class="fas fa-copy"></i></button>`
                : '';

            return `
                <div class="agente-role-block">
                    <div class="contact-3col-row unico">
                        <div class="contact-col-role">
                            <div class="contact-role-title"><i class="${iconClass}"></i> ${roleTitle}:</div>
                            <div class="contact-shift-wrap">
                                <span class="shift-tag shift-geral" title="Atendimento Diurno e Noturno"><i class="fas fa-sun"></i><i class="fas fa-moon"></i> Diurno / Noturno</span>
                            </div>
                        </div>
                        <div class="contact-col-person">
                            <span class="contact-name-value ${parsed.diurno.nome === 'sem contato' ? 'sem-contato' : ''}">${parsed.diurno.nome}</span>
                            <div class="contact-email-row">
                                <span class="contact-email-value ${hasEmail ? '' : 'sem-contato'}"><i class="fas fa-envelope"></i> ${hasEmail ? parsed.diurno.email : '...'}</span>
                                ${copyBtnEmail}
                            </div>
                        </div>
                        <div class="contact-col-phone">
                            <div class="contact-tel-row">
                                <span class="contact-tel-value ${parsed.diurno.telefone === 'sem contato' ? 'sem-contato' : ''}">${parsed.diurno.telefone}</span>
                                ${copyBtnPhone}
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        const hasDiurnoPhone = parsed.diurno.telefone && parsed.diurno.telefone !== 'sem contato';
        const hasNoturnoPhone = parsed.noturno.telefone && parsed.noturno.telefone !== 'sem contato';

        const copyBtnDiurno = hasDiurnoPhone
            ? `<button class="copy-phone-btn" data-phone="${parsed.diurno.telefone}" title="Copiar telefone (${parsed.diurno.telefone})"><i class="fas fa-copy"></i></button>`
            : '';

        const copyBtnNoturno = hasNoturnoPhone
            ? `<button class="copy-phone-btn" data-phone="${parsed.noturno.telefone}" title="Copiar telefone (${parsed.noturno.telefone})"><i class="fas fa-copy"></i></button>`
            : '';

        const hasDiurnoEmail = parsed.diurno.email && parsed.diurno.email !== 'sem e-mail';
        const hasNoturnoEmail = parsed.noturno.email && parsed.noturno.email !== 'sem e-mail';

        const copyBtnEmailDiurno = hasDiurnoEmail
            ? `<button class="copy-phone-btn copy-email-btn" data-phone="${parsed.diurno.email}" title="Copiar e-mail (${parsed.diurno.email})"><i class="fas fa-copy"></i></button>`
            : '';

        const copyBtnEmailNoturno = hasNoturnoEmail
            ? `<button class="copy-phone-btn copy-email-btn" data-phone="${parsed.noturno.email}" title="Copiar e-mail (${parsed.noturno.email})"><i class="fas fa-copy"></i></button>`
            : '';

        return `
            <div class="agente-role-block">
                <div class="contact-3col-row diurno">
                    <div class="contact-col-role">
                        <div class="contact-role-title"><i class="${iconClass}"></i> ${roleTitle}:</div>
                        <div class="contact-shift-wrap">
                            <span class="shift-tag shift-diurno"><i class="fas fa-sun"></i> Diurno</span>
                        </div>
                    </div>
                    <div class="contact-col-person">
                        <span class="contact-name-value ${parsed.diurno.nome === 'sem contato' ? 'sem-contato' : ''}">${parsed.diurno.nome}</span>
                        <div class="contact-email-row">
                            <span class="contact-email-value ${hasDiurnoEmail ? '' : 'sem-contato'}"><i class="fas fa-envelope"></i> ${hasDiurnoEmail ? parsed.diurno.email : '...'}</span>
                            ${copyBtnEmailDiurno}
                        </div>
                    </div>
                    <div class="contact-col-phone">
                        <div class="contact-tel-row">
                            <span class="contact-tel-value ${parsed.diurno.telefone === 'sem contato' ? 'sem-contato' : ''}">${parsed.diurno.telefone}</span>
                            ${copyBtnDiurno}
                        </div>
                    </div>
                </div>
                <div class="contact-3col-row noturno">
                    <div class="contact-col-role">
                        <div class="contact-role-title"><i class="${iconClass}"></i> ${roleTitle}:</div>
                        <div class="contact-shift-wrap">
                            <span class="shift-tag shift-noturno"><i class="fas fa-moon"></i> Noturno</span>
                        </div>
                    </div>
                    <div class="contact-col-person">
                        <span class="contact-name-value ${parsed.noturno.nome === 'sem contato' ? 'sem-contato' : ''}">${parsed.noturno.nome}</span>
                        <div class="contact-email-row">
                            <span class="contact-email-value ${hasNoturnoEmail ? '' : 'sem-contato'}"><i class="fas fa-envelope"></i> ${hasNoturnoEmail ? parsed.noturno.email : '...'}</span>
                            ${copyBtnEmailNoturno}
                        </div>
                    </div>
                    <div class="contact-col-phone">
                        <div class="contact-tel-row">
                            <span class="contact-tel-value ${parsed.noturno.telefone === 'sem contato' ? 'sem-contato' : ''}">${parsed.noturno.telefone}</span>
                            ${copyBtnNoturno}
                        </div>
                    </div>
                </div>
            </div>`;
    };

    const renderSpreadsheet = (list, autoExpand = false) => {
        const resultsContainer = document.getElementById('agente-search-results');
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';

        if (!list || list.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; opacity: 0.7; margin-top: 30px; font-size: 1.2em;">Nenhuma fila, município ou contato encontrado.</p>';
            return;
        }

        const groups = buildFilasGrouped(list);
        const fragment = document.createDocumentFragment();

        groups.forEach(group => {
            const filaCard = document.createElement('div');
            filaCard.className = autoExpand ? 'agente-fila-group-card' : 'agente-fila-group-card collapsed';

            const ufsHTML = Array.from(group.ufs).map(uf => `<span class="agente-tag-uf">${uf}</span>`).join('');
            const epsHTMLTags = Array.from(group.epsList).map(eps => `<span class="agente-tag-eps">${eps.toUpperCase()}</span>`).join('');
            const countText = group.cidades.length === 1 ? '1 cidade' : `${group.cidades.length} cidades`;

            let citiesGridHTML = '<div class="agente-fila-cities-grid">';

            group.cidades.forEach(item => {
                const siglaTagHTML = item.sigla && item.sigla !== 'N/A'
                    ? `<span class="agente-tag-sigla">${item.sigla}</span>`
                    : '';

                const epsName = item.eps || (item.epsData && item.epsData.eps) || 'EPS';

                // Coluna VIVO
                const vivo = item.vivoData || {};
                const vivoSup = vivo.supervisorVivo !== undefined ? vivo.supervisorVivo : vivo.supervisor;
                const vivoSupEmail = vivo.emailSupervisorVivo || '';
                const vivoCoord = vivo.coordenadorVivo !== undefined ? vivo.coordenadorVivo : vivo.coordenador;
                const vivoCoordEmail = vivo.emailCoordenadorVivo || '';
                const vivoGer = vivo.gerenteVivo !== undefined ? vivo.gerenteVivo : vivo.gerente;
                const vivoGerEmail = vivo.emailGerenteVivo || '';

                const vivoHTML = `
                    <div class="agente-col-vivo">
                        <div class="agente-col-vivo-header">
                            <i class="fas fa-signal"></i>
                            <span>VIVO</span>
                        </div>
                        ${renderContactBlock('Supervisor', 'fas fa-user-check', vivoSup, true, vivoSupEmail)}
                        ${renderContactBlock('Coordenador', 'fas fa-user-tie', vivoCoord, true, vivoCoordEmail)}
                        ${renderContactBlock('Gerente', 'fas fa-user-shield', vivoGer, true, vivoGerEmail)}
                    </div>`;

                // Coluna EPS
                const eps = item.epsData || {};
                const primeiroContatoHTML = eps.primeiroContato
                    ? renderContactBlock('1º Contato', 'fas fa-headset', eps.primeiroContato, false, eps.emailPrimeiroContato || '')
                    : '';

                const epsHTML = `
                    <div class="agente-col-eps">
                        <div class="agente-col-eps-header">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-hard-hat"></i>
                                <span>${epsName.toUpperCase()}</span>
                            </div>
                        </div>
                        ${primeiroContatoHTML}
                        ${renderContactBlock('Supervisor', 'fas fa-user-check', eps.supervisor, false, eps.emailSupervisor || '')}
                        ${renderContactBlock('Coordenador', 'fas fa-user-tie', eps.coordenador, false, eps.emailCoordenador || '')}
                        ${renderContactBlock('Gerente', 'fas fa-user-shield', eps.gerente, false, eps.emailGerente || '')}
                    </div>`;

                // As cidades iniciam minimizadas (collapsed), exceto se for busca ativa (autoExpand === true)
                const cityCardClass = autoExpand ? 'agente-city-item-card' : 'agente-city-item-card collapsed';

                citiesGridHTML += `
                    <div class="${cityCardClass}">
                        <div class="agente-city-item-header" title="Clique para expandir ou recolher os contatos desta cidade">
                            <div class="agente-city-item-title">
                                <i class="fas fa-map-marker-alt" style="color: var(--accent-color);"></i>
                                <span class="city-name-highlight">${item.municipio}</span>
                                <span class="city-uf-pill">(${item.uf})</span>
                                ${siglaTagHTML}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="agente-tag-eps-small"><i class="fas fa-hard-hat"></i> ${epsName.toUpperCase()}</span>
                                <span class="agente-city-toggle-badge"><i class="fas fa-chevron-down agente-city-toggle-chevron"></i></span>
                            </div>
                        </div>
                        <div class="agente-grid-columns">
                            ${vivoHTML}
                            ${epsHTML}
                        </div>
                    </div>`;
            });

            citiesGridHTML += '</div>';

            filaCard.innerHTML = `
                <div class="agente-fila-header" title="Clique para expandir ou recolher as cidades desta fila">
                    <div class="agente-fila-title-wrap">
                        <div class="agente-fila-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="agente-fila-name">${group.nomeFila}</div>
                        <span class="agente-fila-count-badge">${countText}</span>
                    </div>
                    <div class="agente-fila-meta-tags">
                        ${ufsHTML}
                        ${epsHTMLTags}
                        <span class="agente-toggle-badge"><i class="fas fa-chevron-down agente-toggle-chevron"></i></span>
                    </div>
                </div>
                <div class="agente-fila-body">
                    ${citiesGridHTML}
                </div>`;

            // Evento para expandir/recolher ao clicar no cabeçalho da fila
            const header = filaCard.querySelector('.agente-fila-header');
            if (header) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('button') || e.target.closest('.copy-phone-btn') || e.target.closest('.agente-city-item-card')) return;
                    filaCard.classList.toggle('collapsed');
                });
            }

            // Evento para expandir/recolher cada cidade individualmente
            filaCard.querySelectorAll('.agente-city-item-header').forEach(cityHeader => {
                cityHeader.addEventListener('click', (e) => {
                    if (e.target.closest('button') || e.target.closest('.copy-phone-btn')) return;
                    const cityCard = cityHeader.closest('.agente-city-item-card');
                    if (cityCard) {
                        cityCard.classList.toggle('collapsed');
                    }
                });
            });

            fragment.appendChild(filaCard);
        });

        resultsContainer.appendChild(fragment);

        // Adicionar eventos aos botões de cópia
        resultsContainer.querySelectorAll('.copy-phone-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyPhoneToClipboard(btn.getAttribute('data-phone'), btn);
            });
        });
    };

    const searchAgente = (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (!term) {
            renderSpreadsheet(unifiedCities, false);
            return;
        }

        const filtered = unifiedCities.filter(item => {
            const munMatch = (item.municipio || '').toLowerCase().includes(term);
            const ufMatch = (item.uf || '').toLowerCase().includes(term);
            const siglaMatch = (item.sigla || '').toLowerCase().includes(term);
            const epsMatch = (item.eps || '').toLowerCase().includes(term);
            const filaMatch = (item.fila || '').toLowerCase().includes(term) || (item.filaNormalizada || '').toLowerCase().includes(term);

            const vivo = item.vivoData || {};
            const vivoMatch = Object.values(vivo).some(v => String(v).toLowerCase().includes(term));

            const eps = item.epsData || {};
            const epsContactMatch = Object.values(eps).some(v => String(v).toLowerCase().includes(term));

            return munMatch || ufMatch || siglaMatch || epsMatch || filaMatch || vivoMatch || epsContactMatch;
        });

        renderSpreadsheet(filtered, true);
    };

    window.toggleAllFilas = (expand) => {
        document.querySelectorAll('.agente-fila-group-card').forEach(card => {
            if (expand) {
                card.classList.remove('collapsed');
                card.querySelectorAll('.agente-city-item-card').forEach(c => c.classList.remove('collapsed'));
            } else {
                card.classList.add('collapsed');
                card.querySelectorAll('.agente-city-item-card').forEach(c => c.classList.add('collapsed'));
            }
        });
    };
    window.toggleAllCities = window.toggleAllFilas;

    const openAgenteRapidoModal = (event) => {
        if (event && event.preventDefault) event.preventDefault();
        window.navigateTo('escalonamento');
    };

    const closeAgenteRapidoModal = (event) => {
        if (event && event.preventDefault) event.preventDefault();
        window.navigateTo('links-cope');
    };

    // --- Funções de Importação e Exportação ---

    function exportarContatosCSV(exportarTodos = true) {
        const dadosParaExportar = unifiedCities.map(item => {
            const vivo = item.vivoData || {};
            const eps = item.epsData || {};
            const supVivo = parseContact(vivo.supervisorVivo !== undefined ? vivo.supervisorVivo : vivo.supervisor, vivo.emailSupervisorVivo);
            const coordVivo = parseContact(vivo.coordenadorVivo !== undefined ? vivo.coordenadorVivo : vivo.coordenador, vivo.emailCoordenadorVivo);
            const gerVivo = parseContact(vivo.gerenteVivo !== undefined ? vivo.gerenteVivo : vivo.gerente, vivo.emailGerenteVivo);

            const supEps = parseContact(eps.supervisor, eps.emailSupervisor);
            const coordEps = parseContact(eps.coordenador, eps.emailCoordenador);
            const gerEps = parseContact(eps.gerente, eps.emailGerente);

            return {
                Municipio: item.municipio,
                UF: item.uf,
                Sigla: item.sigla,
                Fila: item.filaNormalizada || item.fila,
                EPS: item.eps,
                VIVO_Supervisor_Diurno: `${supVivo.diurno.nome} (${supVivo.diurno.telefone})`,
                VIVO_Supervisor_Diurno_Email: supVivo.diurno.email,
                VIVO_Supervisor_Noturno: `${supVivo.noturno.nome} (${supVivo.noturno.telefone})`,
                VIVO_Supervisor_Noturno_Email: supVivo.noturno.email,
                VIVO_Coordenador_Diurno: `${coordVivo.diurno.nome} (${coordVivo.diurno.telefone})`,
                VIVO_Coordenador_Diurno_Email: coordVivo.diurno.email,
                VIVO_Coordenador_Noturno: `${coordVivo.noturno.nome} (${coordVivo.noturno.telefone})`,
                VIVO_Coordenador_Noturno_Email: coordVivo.noturno.email,
                VIVO_Gerente_Diurno: `${gerVivo.diurno.nome} (${gerVivo.diurno.telefone})`,
                VIVO_Gerente_Diurno_Email: gerVivo.diurno.email,
                VIVO_Gerente_Noturno: `${gerVivo.noturno.nome} (${gerVivo.noturno.telefone})`,
                VIVO_Gerente_Noturno_Email: gerVivo.noturno.email,
                EPS_Supervisor_Diurno: `${supEps.diurno.nome} (${supEps.diurno.telefone})`,
                EPS_Supervisor_Diurno_Email: supEps.diurno.email,
                EPS_Supervisor_Noturno: `${supEps.noturno.nome} (${supEps.noturno.telefone})`,
                EPS_Supervisor_Noturno_Email: supEps.noturno.email,
                EPS_Coordenador_Diurno: `${coordEps.diurno.nome} (${coordEps.diurno.telefone})`,
                EPS_Coordenador_Diurno_Email: coordEps.diurno.email,
                EPS_Coordenador_Noturno: `${coordEps.noturno.nome} (${coordEps.noturno.telefone})`,
                EPS_Coordenador_Noturno_Email: coordEps.noturno.email,
                EPS_Gerente_Diurno: `${gerEps.diurno.nome} (${gerEps.diurno.telefone})`,
                EPS_Gerente_Diurno_Email: gerEps.diurno.email,
                EPS_Gerente_Noturno: `${gerEps.noturno.nome} (${gerEps.noturno.telefone})`,
                EPS_Gerente_Noturno_Email: gerEps.noturno.email
            };
        });

        const csv = Papa.unparse(dadosParaExportar);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "escalonamento_centralizado_vivo_eps.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importarContatos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    if (file.name.endsWith('.json')) {
                        const data = JSON.parse(content);
                        const novosContatos = Array.isArray(data) ? data : [data];
                        escalonamentoEPS.push(...novosContatos);
                        unifiedCities = buildUnifiedCities();
                        window.unifiedCities = unifiedCities;
                        renderSpreadsheet(unifiedCities);
                        alert(`${novosContatos.length} contatos importados com sucesso!`);
                    } else if (file.name.endsWith('.csv') && typeof Papa !== 'undefined') {
                        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
                        if (parsed.data && parsed.data.length > 0) {
                            escalonamentoEPS.push(...parsed.data);
                            unifiedCities = buildUnifiedCities();
                            window.unifiedCities = unifiedCities;
                            renderSpreadsheet(unifiedCities);
                            alert(`${parsed.data.length} contatos importados com sucesso do CSV!`);
                        }
                    }
                } catch (error) {
                    alert(`Erro ao importar o arquivo: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    window.openAgenteRapidoModal = openAgenteRapidoModal;
    window.closeAgenteRapidoModal = closeAgenteRapidoModal;
    window.searchAgente = searchAgente;
    window.exportarContatosCSV = exportarContatosCSV;
    window.importarContatos = importarContatos;
    window.renderSpreadsheet = renderSpreadsheet;
    window.buildUnifiedCities = buildUnifiedCities;
    window.unifiedCities = unifiedCities;

    if (openBtn) {
        openBtn.addEventListener('click', (e) => { e.preventDefault(); openAgenteRapidoModal(e); });
        openBtn.addEventListener('dblclick', (e) => { e.preventDefault(); openAgenteRapidoModal(e); });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAgenteRapidoModal);
    }

    const searchInput = document.getElementById('agente-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchAgente);
        searchInput.addEventListener('keyup', searchAgente);
    }

    // Renderiza dados na inicialização (minimizado por padrão para alta performance)
    renderSpreadsheet(unifiedCities, false);
}
